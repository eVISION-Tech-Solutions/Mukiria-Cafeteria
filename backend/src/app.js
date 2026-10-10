import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  categories,
  envelope,
  formatMeal,
  formatOrder,
  normalizeKenyanPhone,
  toMpesaPhone,
} from "./utils.js";

const env = process.env;
const production = env.NODE_ENV === "production";
if (production && !env.CORS_ALLOWED_ORIGINS?.trim()) {
  throw new Error("CORS_ALLOWED_ORIGINS must be set to explicit frontend origins in production.");
}
const allowedOrigins = (env.CORS_ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const maxPageSize = 100;
const mealSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(10000).default(""),
  category: z.enum(Object.keys(categories)),
  price: z.coerce.number().positive().max(100000).refine((n) => Number.isFinite(n)),
  available: z.union([z.boolean(), z.enum(["true", "false"])]).default(true)
    .transform((v) => v === true || v === "true"),
});
const orderSchema = z.object({
  phone_number: z.string().min(1).max(20),
  items: z.array(z.object({
    meal_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(50),
  })).min(1).max(50),
  paid: z.boolean().optional(),
}).superRefine(({ items, paid }, ctx) => {
  if (new Set(items.map((item) => item.meal_id)).size !== items.length) {
    ctx.addIssue({ code: "custom", message: "Duplicate meals in order are not allowed.", path: ["items"] });
  }
  if (paid) {
    ctx.addIssue({ code: "custom", message: "Orders cannot be marked as paid via the public API.", path: ["paid"] });
  }
});

function requiredEnv(name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const supabaseUrl = requiredEnv("SUPABASE_URL");
const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = requiredEnv("SUPABASE_ANON_KEY");
if (production && (allowedOrigins.length === 0 || allowedOrigins.includes("*"))) {
  throw new Error("CORS_ALLOWED_ORIGINS must contain explicit origins in production.");
}

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY === "true" ? 1 : false);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

const publicLimiter = rateLimit({
  windowMs: 60_000,
  limit: Number(env.API_RATE_LIMIT_PER_MINUTE ?? 120),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => fail(res, "Too many requests. Please try again shortly.", 429),
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: Number(env.LOGIN_RATE_LIMIT_PER_15_MINUTES ?? 10),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => fail(res, "Too many login attempts. Please try again later.", 429),
});
app.use("/api", publicLimiter);

function send(res, data = null, message = "Success.", status = 200) {
  return res.status(status).json(envelope(data, message));
}

function fail(res, message, status = 400, data = null) {
  return res.status(status).json(envelope(data, message, false));
}

function validationError(error) {
  return error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`).join("; ");
}

function supabaseError(error, operation) {
  if (!error) return null;
  console.error(`${operation}: ${error.message}`, { code: error.code });
  return error;
}

async function queryOrThrow(query, operation) {
  const { data, error } = await query;
  if (supabaseError(error, operation)) {
    const status = error.code === "PGRST116" ? 404
      : ["23503", "23505"].includes(error.code) ? 409
      : error.code === "P0001" ? 400 : 500;
    throw Object.assign(new Error(error.message), { status, code: error.code });
  }
  return data;
}

async function attachAuth(req, res, next) {
  const token = req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return fail(res, "Authentication credentials were not provided.", 401);
  try {
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return fail(res, "Invalid or expired access token.", 401);
    const profile = await queryOrThrow(
      db.from("staff_profiles").select("*").eq("id", user.id).maybeSingle(),
      "Load staff profile",
    );
    if (!profile || !profile.is_active) return fail(res, "Staff account is inactive or missing.", 403);
    req.user = { ...profile, email: user.email };
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

function requireStaff(req, res, next) {
  if (!req.user) return attachAuth(req, res, () => requireStaff(req, res, next));
  return next();
}

async function getOrder(id) {
  const order = await queryOrThrow(
    db.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle(),
    "Load order",
  );
  if (!order) return null;
  if (order.payment_status === "paid") {
    order.qr_code = await QRCode.toDataURL(order.ticket_number);
  }
  return formatOrder(order);
}

async function getOrderByTicket(ticket) {
  const order = await queryOrThrow(
    db.from("orders").select("*, items:order_items(*)").ilike("ticket_number", ticket).maybeSingle(),
    "Load ticket",
  );
  if (!order) return null;
  if (order.payment_status === "paid") order.qr_code = await QRCode.toDataURL(order.ticket_number);
  return formatOrder(order);
}

function parsePagination(req) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number.parseInt(req.query.page_size, 10) || 20));
  return { page, pageSize, from: (page - 1) * pageSize, to: page * pageSize - 1 };
}

function safeSearch(value) {
  return String(value ?? "").replace(/[%,._()\\]/g, "").trim().slice(0, 100);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(Object.assign(new Error("Meal images must be JPEG, PNG, or WebP."), { status: 400 }));
    }
    callback(null, true);
  },
});

async function mealPayload(req, partial = false) {
  const source = req.is("multipart/form-data") ? req.body : req.body;
  const schema = partial ? mealSchema.partial() : mealSchema;
  const parsed = schema.safeParse(source);
  if (!parsed.success) throw Object.assign(new Error(validationError(parsed.error)), { status: 400 });
  const payload = parsed.data;
  if (req.file) {
    const extension = req.file.mimetype.split("/")[1].replace("jpeg", "jpg");
    const path = `meals/${crypto.randomUUID()}.${extension}`;
    const { error } = await db.storage.from("meal-images").upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (supabaseError(error, "Upload meal image")) throw Object.assign(new Error("Could not upload meal image."), { status: 502 });
    payload.image = db.storage.from("meal-images").getPublicUrl(path).data.publicUrl;
  }
  return payload;
}

app.get("/health", (_req, res) => send(res, { status: "ok" }, "Service is healthy."));
app.get("/api/health/", (_req, res) => send(res, { status: "ok" }, "Service is healthy."));
app.get("/ready", async (_req, res, next) => {
  try {
    const { error } = await db.from("meals").select("id").limit(1);
    if (error) throw Object.assign(new Error("Supabase database is unavailable."), { status: 503 });
    return send(res, { status: "ready" }, "Service is ready.");
  } catch (error) { next(error); }
});

app.post("/api/auth/login/", loginLimiter, async (req, res, next) => {
  try {
    const parsed = z.object({ username: z.string().trim().min(1).max(150), password: z.string().min(1).max(256) }).safeParse(req.body);
    if (!parsed.success) return fail(res, validationError(parsed.error));
    const { data: profile, error: profileError } = await db.from("staff_profiles")
      .select("id,username,email,first_name,last_name,role,phone_number,is_active,created_at")
      .ilike("username", parsed.data.username).maybeSingle();
    if (supabaseError(profileError, "Find staff login")) return fail(res, "Unable to authenticate.", 500);
    if (!profile?.is_active || !profile.email) return fail(res, "Invalid username or password.", 401);
    const { data, error } = await authClient.auth.signInWithPassword({
      email: profile.email,
      password: parsed.data.password,
    });
    if (error || !data.session || !["administrator", "cashier"].includes(profile.role)) {
      return fail(res, "Invalid username or password.", 401);
    }
    const user = {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      role_display: profile.role === "administrator" ? "Administrator" : "Cashier",
      phone_number: profile.phone_number ?? "",
      date_joined: profile.created_at,
    };
    return send(res, {
      tokens: { access: data.session.access_token, refresh: data.session.refresh_token },
      user,
    }, "Login successful.");
  } catch (error) { next(error); }
});

app.post("/api/auth/logout/", attachAuth, async (req, res, next) => {
  try {
    const { error } = await db.auth.admin.signOut(req.accessToken, "local");
    if (error) {
      console.error("Supabase session sign-out failed:", error.message);
      return fail(res, "Could not log out. Please try again.", 502);
    }
    return send(res, null, "Logged out successfully.");
  } catch (error) { next(error); }
});

app.post("/api/auth/token/refresh/", async (req, res, next) => {
  try {
    const parsed = z.object({ refresh: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return fail(res, validationError(parsed.error));
    const { data, error } = await authClient.auth.refreshSession({ refresh_token: parsed.data.refresh });
    if (error || !data.session) return fail(res, "Could not refresh token.", 401);
    return send(res, {
      access: data.session.access_token,
      refresh: data.session.refresh_token,
    }, "Token refreshed successfully.");
  } catch (error) { next(error); }
});

app.get("/api/auth/me/", attachAuth, (req, res) => {
  const { id, username, email, first_name, last_name, role, phone_number, created_at } = req.user;
  return send(res, {
    id, username, email, first_name, last_name, role, phone_number,
    role_display: role === "administrator" ? "Administrator" : "Cashier",
    date_joined: created_at,
  }, "Profile retrieved successfully.");
});

app.post("/api/auth/change-password/", attachAuth, async (req, res) => {
  const parsed = z.object({ old_password: z.string().min(1), new_password: z.string().min(10).max(128) }).safeParse(req.body);
  if (!parsed.success) return fail(res, validationError(parsed.error));
  const { error: checkError } = await authClient.auth.signInWithPassword({
    email: req.user.email, password: parsed.data.old_password,
  });
  if (checkError) return fail(res, "Current password is incorrect.", 400);
  const { error } = await db.auth.admin.updateUserById(req.user.id, { password: parsed.data.new_password });
  if (supabaseError(error, "Change staff password")) return fail(res, "Could not change password.", 500);
  return send(res, null, "Password changed successfully.");
});

app.get("/api/menu/", async (_req, res, next) => {
  try {
    const meals = await queryOrThrow(
      db.from("meals").select("id,name,description,category,image,price").eq("available", true).order("name"),
      "List public menu",
    );
    return send(res, meals.map((meal) => ({ ...meal, category: categories[meal.category] ?? meal.category })), "Menu retrieved successfully.");
  } catch (error) { next(error); }
});

app.get("/api/meals/meals/", attachAuth, async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = parsePagination(req);
    let query = db.from("meals").select("*", { count: "exact" }).order("name").range(from, to);
    if (req.query.search) {
      const search = safeSearch(req.query.search);
      if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const { data, count, error } = await query;
    if (supabaseError(error, "List meals")) throw Object.assign(new Error("Could not retrieve meals."), { status: 500 });
    const results = data.map(formatMeal);
    return send(res, { count, next: count > page * pageSize ? page + 1 : null, previous: page > 1 ? page - 1 : null, results }, "Meals retrieved successfully.");
  } catch (error) { next(error); }
});

app.post("/api/meals/", attachAuth, upload.single("image"), async (req, res, next) => {
  try {
    const payload = await mealPayload(req);
    const meal = await queryOrThrow(db.from("meals").insert(payload).select("*").single(), "Create meal");
    return send(res, formatMeal(meal), "Meal created successfully.", 201);
  } catch (error) { next(error); }
});

app.patch("/api/meals/:id/availability/", attachAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ available: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return fail(res, validationError(parsed.error));
    const meal = await queryOrThrow(db.from("meals").update(parsed.data).eq("id", req.params.id).select("*").maybeSingle(), "Update meal availability");
    if (!meal) return fail(res, "Meal not found.", 404);
    return send(res, formatMeal(meal), `Meal marked as ${meal.available ? "available" : "unavailable"}.`);
  } catch (error) { next(error); }
});

app.patch("/api/meals/:id/", attachAuth, upload.single("image"), async (req, res, next) => {
  try {
    const payload = await mealPayload(req, true);
    if (Object.keys(payload).length === 0) return fail(res, "No meal fields were provided.");
    const meal = await queryOrThrow(db.from("meals").update(payload).eq("id", req.params.id).select("*").maybeSingle(), "Update meal");
    if (!meal) return fail(res, "Meal not found.", 404);
    return send(res, formatMeal(meal), "Meal updated successfully.");
  } catch (error) { next(error); }
});

app.delete("/api/meals/:id/", attachAuth, async (req, res, next) => {
  try {
    const { data, error } = await db.from("meals").delete().eq("id", req.params.id).select("id").maybeSingle();
    if (error?.code === "23503") return fail(res, "This meal is part of an existing order and cannot be deleted.", 409);
    if (supabaseError(error, "Delete meal")) throw Object.assign(new Error("Could not delete meal."), { status: 500 });
    if (!data) return fail(res, "Meal not found.", 404);
    return send(res, null, "Meal deleted successfully.");
  } catch (error) { next(error); }
});

app.post("/api/orders/create/", async (req, res, next) => {
  try {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, validationError(parsed.error));
    let phone;
    try { phone = normalizeKenyanPhone(parsed.data.phone_number); }
    catch (error) { return fail(res, error.message); }
    const orderId = await queryOrThrow(
      db.rpc("create_order", { p_phone_number: phone, p_items: parsed.data.items }),
      "Create order",
    );
    const order = await getOrder(orderId);
    return send(res, {
      order,
      payment: {
        amount: order.total_amount,
        message: "Order created. Initiate M-Pesa STK Push to complete payment.",
        stk_push_url: "/api/payments/stk-push/",
      },
    }, "Order created successfully.", 201);
  } catch (error) {
    if (error.code === "P0001") return fail(res, error.message);
    next(error);
  }
});

app.get("/api/orders/", attachAuth, async (req, res, next) => {
  try {
    const { page, pageSize, from, to } = parsePagination(req);
    let query = db.from("orders").select("*, items:order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false }).range(from, to);
    if (req.query.search) {
      const search = safeSearch(req.query.search);
      if (search) query = query.or(`ticket_number.ilike.%${search}%,phone_number.ilike.%${search}%`);
    }
    if (req.query.payment_status) query = query.eq("payment_status", req.query.payment_status);
    if (req.query.collection_status) query = query.eq("collection_status", req.query.collection_status);
    const { data, count, error } = await query;
    if (supabaseError(error, "List orders")) throw Object.assign(new Error("Could not retrieve orders."), { status: 500 });
    const results = data.map((order) => ({
      id: order.id,
      ticket_number: order.ticket_number,
      phone_number: order.phone_number,
      total_amount: String(order.total_amount),
      payment_status: order.payment_status,
      payment_status_display: order.payment_status,
      collection_status: order.collection_status,
      collection_status_display: order.collection_status,
      items: (order.items ?? []).map((item) => ({ name: item.meal_name, qty: item.quantity, price: String(item.unit_price) })),
      created_at: order.created_at,
    }));
    return send(res, { count, next: count > page * pageSize ? page + 1 : null, previous: page > 1 ? page - 1 : null, results }, "Orders retrieved successfully.");
  } catch (error) { next(error); }
});

app.get("/api/orders/:id/", attachAuth, async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return fail(res, "Order not found.", 404);
    const order = await getOrder(req.params.id);
    return order ? send(res, order, "Order retrieved successfully.") : fail(res, "Order not found.", 404);
  } catch (error) { next(error); }
});

app.post("/api/orders/verify/", attachAuth, async (req, res, next) => {
  try {
    const parsed = z.object({ ticket_number: z.string().trim().min(1).max(30) }).safeParse(req.body);
    if (!parsed.success) return fail(res, validationError(parsed.error));
    const result = await queryOrThrow(db.rpc("collect_order", {
      p_ticket_number: parsed.data.ticket_number.toUpperCase(),
      p_staff_id: req.user.id,
    }), "Verify ticket");
    const order = await getOrder(result);
    return send(res, order, "Collection verified successfully.");
  } catch (error) {
    if (error.code === "P0001") return fail(res, error.message);
    next(error);
  }
});

app.post("/api/payments/stk-push/", async (req, res, next) => {
  let transactionId;
  try {
    const parsed = z.object({ order_id: z.coerce.number().int().positive(), phone_number: z.string().min(1).max(20) }).safeParse(req.body);
    if (!parsed.success) return fail(res, validationError(parsed.error));
    const order = await queryOrThrow(db.from("orders").select("*").eq("id", parsed.data.order_id).maybeSingle(), "Load order for payment");
    if (!order) return fail(res, "Order not found.", 404);
    if (order.payment_status === "paid") return fail(res, "This order has already been paid.", 409);
    const phone = normalizeKenyanPhone(parsed.data.phone_number);
    if (phone !== order.phone_number) return fail(res, "Payment phone number must match the phone number on the order.", 400);
    const existingPayment = await queryOrThrow(db.from("payment_transactions").select("id")
      .eq("order_id", order.id).eq("status", "initiated").limit(1).maybeSingle(), "Check active payment");
    if (existingPayment) return fail(res, "A payment request is already in progress for this order.", 409);
    const config = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_PASSKEY", "MPESA_SHORTCODE", "MPESA_CALLBACK_URL"];
    if (config.some((key) => !env[key])) return fail(res, "M-Pesa payments are not configured.", 503);
    if (production && !env.MPESA_CALLBACK_URL.startsWith("https://")) return fail(res, "M-Pesa callback URL must use HTTPS.", 503);
    const transaction = await queryOrThrow(db.from("payment_transactions").insert({
      order_id: order.id, amount: order.total_amount, phone_number: phone, status: "initiated",
    }).select("*").single(), "Create payment transaction");
    transactionId = transaction.id;
    const apiRoot = env.MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
    const credentials = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString("base64");
    const tokenResponse = await fetch(`${apiRoot}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) throw Object.assign(new Error("Could not connect to M-Pesa."), { status: 502 });
    const { access_token: accessToken } = await tokenResponse.json();
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).reduce((out, part) => ({ ...out, [part.type]: part.value }), {});
    const timestamp = `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
    const password = Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`).toString("base64");
    const stkResponse = await fetch(`${apiRoot}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: env.MPESA_TRANSACTION_TYPE ?? "CustomerPayBillOnline",
        Amount: Math.round(Number(order.total_amount)),
        PartyA: toMpesaPhone(phone),
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: toMpesaPhone(phone),
        CallBackURL: env.MPESA_CALLBACK_URL,
        AccountReference: order.ticket_number,
        TransactionDesc: `Mukiria Eats ${order.ticket_number}`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = await stkResponse.json();
    if (!stkResponse.ok || Number(result.ResponseCode) !== 0) {
      await queryOrThrow(db.from("payment_transactions").update({
        status: "failed",
        result_desc: result.errorMessage ?? result.ResponseDescription ?? "STK push failed.",
      }).eq("id", transaction.id), "Record failed M-Pesa request");
      return fail(res, result.errorMessage ?? "Could not initiate M-Pesa payment.", 502);
    }
    const payment = await queryOrThrow(db.from("payment_transactions").update({
      checkout_request_id: result.CheckoutRequestID,
      merchant_request_id: result.MerchantRequestID,
    }).eq("id", transaction.id).select("*").single(), "Save M-Pesa request");
    return send(res, {
      payment_id: payment.id,
      checkout_request_id: payment.checkout_request_id,
      status: payment.status,
      order: await getOrder(order.id),
    }, "STK push initiated. Complete payment on your phone.", 201);
  } catch (error) {
    if (transactionId) {
      const { error: updateError } = await db.from("payment_transactions").update({
        status: "failed",
        result_desc: "M-Pesa request failed before a checkout request was created.",
      }).eq("id", transactionId).eq("status", "initiated");
      if (updateError) console.error("Could not mark interrupted payment as failed:", updateError.message);
    }
    next(error);
  }
});

app.post("/api/payments/callback/", async (req, res, next) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    const checkoutId = callback?.CheckoutRequestID;
    if (!checkoutId) return fail(res, "Invalid M-Pesa callback.", 400);
    const metadata = Object.fromEntries((callback.CallbackMetadata?.Item ?? []).map(({ Name, Value }) => [Name, Value]));
    const payment = await queryOrThrow(db.from("payment_transactions")
      .select("id,amount,status").eq("checkout_request_id", checkoutId).maybeSingle(), "Find M-Pesa transaction");
    if (!payment) return fail(res, "Payment transaction not found.", 404);
    if (payment.status !== "initiated") return send(res, null, "Callback already processed.");
    const success = Number(callback.ResultCode) === 0;
    const result = await queryOrThrow(db.rpc("process_payment_callback", {
      p_checkout_request_id: checkoutId,
      p_result_code: callback.ResultCode,
      p_result_desc: String(callback.ResultDesc ?? "").slice(0, 1000),
      p_receipt: String(metadata.MpesaReceiptNumber ?? ""),
      p_amount: Number(metadata.Amount ?? 0),
      p_raw_callback: req.body,
    }), "Process M-Pesa callback");
    if (!result) console.error("Payment callback did not match the expected amount.", { checkoutId });
    return send(res, null, success ? "Callback received." : "Payment failure callback received.");
  } catch (error) { next(error); }
});

app.get("/api/payments/status/:orderId/", async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.orderId)) return fail(res, "Order not found.", 404);
    const order = await queryOrThrow(db.from("orders").select("id,payment_status,collection_status").eq("id", req.params.orderId).maybeSingle(), "Load payment status");
    if (!order) return fail(res, "Order not found.", 404);
    const transaction = await queryOrThrow(db.from("payment_transactions").select("*")
      .eq("order_id", order.id).order("created_at", { ascending: false }).limit(1).maybeSingle(), "Load latest payment");
    return send(res, {
      order_id: order.id,
      payment_status: order.payment_status,
      collection_status: order.collection_status,
      transaction_status: transaction?.status ?? null,
    }, "Payment status retrieved.");
  } catch (error) { next(error); }
});

app.get("/api/payments/transactions/", attachAuth, async (_req, res, next) => {
  try {
    const payments = await queryOrThrow(db.from("payment_transactions")
      .select("*, order:orders(ticket_number)").order("created_at", { ascending: false }).limit(100), "List payments");
    return send(res, payments.map((payment) => ({
      id: payment.id,
      ticket_number: payment.order?.ticket_number,
      amount: String(payment.amount),
      phone_number: payment.phone_number,
      status: payment.status,
      mpesa_receipt: payment.mpesa_receipt,
      result_desc: payment.result_desc,
      created_at: payment.created_at,
    })), "Payments retrieved successfully.");
  } catch (error) { next(error); }
});

app.get("/api/orders/dashboard/", attachAuth, async (_req, res, next) => {
  try {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
    const start = new Date(`${today}T00:00:00+03:00`).toISOString();
    const end = new Date(`${today}T23:59:59.999+03:00`).toISOString();
    const orders = await queryOrThrow(db.from("orders")
      .select("*, items:order_items(*)").gte("created_at", start).lte("created_at", end)
      .order("created_at", { ascending: false }).limit(1000), "Load today's dashboard orders");
    const paid = orders.filter((order) => order.payment_status === "paid");
    const revenue = paid.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const trendStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const weekly = await queryOrThrow(db.from("orders")
      .select("created_at,total_amount,items:order_items(meal_name,quantity,unit_price,subtotal,meal:meals(category))")
      .eq("payment_status", "paid").gte("created_at", trendStart.toISOString()).lte("created_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(1000), "Load weekly dashboard data");
    const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" });
    const labelFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Nairobi", weekday: "short" });
    const trend = new Map();
    const mealCounts = new Map();
    const combinations = new Map();
    const categoryRevenue = new Map();
    const peakHours = new Map();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
      const key = dayFormatter.format(date);
      trend.set(key, { label: labelFormatter.format(date), revenue: 0, orders: 0 });
    }
    let weeklyRevenue = 0;
    for (const order of weekly) {
      const key = dayFormatter.format(new Date(order.created_at));
      const day = trend.get(key);
      if (day) {
        day.revenue += Number(order.total_amount);
        day.orders += 1;
      }
      weeklyRevenue += Number(order.total_amount);
      const hourFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Nairobi", hour: "numeric", hour12: true,
      });
      const hour = hourFormatter.format(new Date(order.created_at)).replace(/\s/g, "").toUpperCase();
      peakHours.set(hour, (peakHours.get(hour) ?? 0) + 1);
      const orderNames = [...new Set((order.items ?? []).map((item) => item.meal_name))].sort();
      for (let index = 0; index < orderNames.length; index += 1) {
        for (let next = index + 1; next < orderNames.length; next += 1) {
          const pair = `${orderNames[index]} + ${orderNames[next]}`;
          combinations.set(pair, (combinations.get(pair) ?? 0) + 1);
        }
      }
      for (const item of order.items ?? []) {
        mealCounts.set(item.meal_name, (mealCounts.get(item.meal_name) ?? 0) + item.quantity);
        const category = categories[item.meal?.category] ?? item.meal?.category ?? "Other";
        categoryRevenue.set(category, (categoryRevenue.get(category) ?? 0) + Number(item.subtotal));
      }
    }
    let mealsSold = 0;
    for (const order of paid) {
      mealsSold += (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
    }
    const latest = await queryOrThrow(db.from("orders").select("*, items:order_items(*)")
      .eq("payment_status", "paid").order("created_at", { ascending: false }).limit(10), "Load recent orders");
    const topMeals = [...mealCounts].map(([name, sold]) => ({ name, sold })).sort((a, b) => b.sold - a.sold).slice(0, 5);
    const recent = latest.map(formatOrder);
    return send(res, {
      today_revenue: revenue.toFixed(2),
      today_orders: orders.length,
      pending_collections: paid.filter((order) => order.collection_status === "uncollected").length,
      collected_orders: paid.filter((order) => order.collection_status === "collected").length,
      meals_sold_today: mealsSold,
      recent_orders: recent.map((order) => ({ ...order, items: (order.items ?? []).map(({ meal_name, quantity, unit_price }) => ({ name: meal_name, qty: quantity, price: unit_price })) })),
      revenue_trend: [...trend.values()].map((day) => ({ ...day, revenue: Math.round(day.revenue * 100) / 100 })),
      top_meals: topMeals,
      combinations: [...combinations].map(([pair, count]) => ({ pair, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      category_sales: [...categoryRevenue].map(([name, value]) => ({ name, value: weeklyRevenue ? Math.round(value / weeklyRevenue * 1000) / 10 : 0 })),
      peak_hours: [...peakHours].map(([hour, count]) => ({ hour, orders: count })),
      best_day: [...trend.values()].sort((a, b) => b.revenue - a.revenue)[0]?.label ?? null,
      best_day_value: String(Math.round(Math.max(0, ...[...trend.values()].map((day) => day.revenue)))),
      best_meal: topMeals[0]?.name ?? null,
      best_meal_sold: topMeals[0] ? String(topMeals[0].sold) : null,
      busiest_hour: [...peakHours].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      busiest_hour_orders: [...peakHours].length ? String(Math.max(...peakHours.values())) : null,
    }, "Dashboard data retrieved successfully.");
  } catch (error) { next(error); }
});

app.get("/api/reports/summary/", attachAuth, async (_req, res, next) => {
  try {
    const summary = await queryOrThrow(db.rpc("get_report_summary"), "Load report summary");
    const totals = Array.isArray(summary) ? summary[0] : summary;
    return send(res, {
      total_orders: Number(totals?.total_orders ?? 0),
      total_revenue: Number(totals?.total_revenue ?? 0).toFixed(2),
      paid_orders: Number(totals?.paid_orders ?? 0),
      pending_orders: Number(totals?.pending_orders ?? 0),
    }, "Report summary retrieved.");
  } catch (error) { next(error); }
});

app.get("/api/reports/sales/:period/", attachAuth, async (req, res, next) => {
  try {
    if (!["daily", "weekly", "monthly", "yearly"].includes(req.params.period)) return fail(res, "Unsupported sales report period.");
    const report = await queryOrThrow(db.rpc("get_sales_report", { p_period: req.params.period }), "Load sales report");
    return send(res, report.map((row) => ({ ...row, revenue: Number(row.revenue).toFixed(2) })), "Sales report retrieved.");
  } catch (error) { next(error); }
});

app.get("/api/reports/meals/", attachAuth, async (_req, res, next) => {
  try {
    const report = await queryOrThrow(db.rpc("get_meal_performance_report"), "Load meal report");
    return send(res, report.map((row) => ({ ...row, sold: Number(row.sold), revenue: Number(row.revenue).toFixed(2) })), "Meal report retrieved.");
  } catch (error) { next(error); }
});

app.get("/api/reports/payments/", attachAuth, async (_req, res, next) => {
  try {
    const payments = await queryOrThrow(db.from("payment_transactions")
      .select("status,amount,created_at,order:orders(ticket_number)").order("created_at", { ascending: false }), "Load payment report");
    return send(res, payments, "Payment report retrieved.");
  } catch (error) { next(error); }
});

app.use((req, res) => fail(res, `Route not found: ${req.method} ${req.path}`, 404));
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  const status = Number(error.status) || (error instanceof multer.MulterError ? 400 : error.message === "Origin is not allowed by CORS." ? 403 : 500);
  if (status >= 500) console.error("Unhandled API error:", error);
  return fail(res, status >= 500 ? "An unexpected server error occurred." : error.message, status);
});

export default app;
