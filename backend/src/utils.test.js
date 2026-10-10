import test from "node:test";
import assert from "node:assert/strict";
import { categories, envelope, formatMeal, normalizeKenyanPhone, toMpesaPhone } from "./utils.js";

test("normalizes supported Kenyan phone formats", () => {
  assert.equal(normalizeKenyanPhone("0712 345 678"), "0712345678");
  assert.equal(normalizeKenyanPhone("+254 712-345-678"), "0712345678");
  assert.equal(normalizeKenyanPhone("0112345678"), "0112345678");
  assert.equal(toMpesaPhone("0712345678"), "254712345678");
});

test("rejects unsupported phone formats", () => {
  assert.throws(() => normalizeKenyanPhone("123456"));
  assert.throws(() => normalizeKenyanPhone("2547123456789"));
});

test("maps database meal categories into the legacy API shape", () => {
  assert.deepEqual(categories.main_meals, "Main Meals");
  assert.deepEqual(formatMeal({ category: "main_meals", price: 50 }), {
    category: "main_meals",
    category_display: "Main Meals",
    price: "50",
  });
});

test("creates the frontend-compatible API envelope", () => {
  assert.deepEqual(envelope([{ id: 1 }], "Loaded"), {
    success: true,
    message: "Loaded",
    data: [{ id: 1 }],
  });
});
