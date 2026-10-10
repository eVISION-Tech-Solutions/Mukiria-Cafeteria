import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { type Meal, type Order } from "./types";
import { useMenu } from "@/hooks/useMenu";
import { createOrder as apiCreateOrder } from "@/lib/orders";
import api from "@/lib/api";
import { CATEGORY_LABEL_MAP, CATEGORY_VALUE_MAP } from "@/lib/categories";

export type CartItem = { meal: Meal; qty: number };

type MealInput = Omit<Meal, "id"> & { image?: string | File | null };

type AppState = {
  meals: Meal[];
  addMeal: (meal: MealInput) => Promise<void>;
  updateMeal: (meal: Meal & { image?: string | File | null }) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  toggleAvailability: (id: string) => Promise<void>;

  cart: CartItem[];
  addToCart: (meal: Meal) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;

  orders: Order[];
  placeOrder: (phone: string) => Promise<Order>;
  markCollected: (id: string) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;
};

const AppContext = createContext<AppState | null>(null);

const toApiCategory = (category?: string) => {
  if (!category) return "main_meals";
  return CATEGORY_VALUE_MAP[category as keyof typeof CATEGORY_VALUE_MAP] ?? category;
};

const formatMeal = (meal: Partial<Meal> & { category_display?: string; category?: string }) => ({
  id: String(meal.id ?? Date.now()),
  name: meal.name ?? "",
  description: meal.description ?? "",
  category:
    meal.category_display ??
    CATEGORY_LABEL_MAP[meal.category as keyof typeof CATEGORY_LABEL_MAP] ??
    meal.category ??
    "Main Meals",
  image: meal.image ?? null,
  price: Number(meal.price ?? 0),
  available: meal.available ?? true,
  rating: meal.rating ?? 4.5,
});

const normalizeMealsPayload = (payload: unknown): Partial<Meal>[] => {
  if (Array.isArray(payload)) {
    return payload as Partial<Meal>[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.results)) {
      return record.results as Partial<Meal>[];
    }

    if (record.data && typeof record.data === "object") {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.results)) {
        return nested.results as Partial<Meal>[];
      }
      if (Array.isArray(nested.data)) {
        return nested.data as Partial<Meal>[];
      }
    }
  }

  return [];
};

const postMeal = async (url: string, meal: MealInput, method: "post" | "patch") => {
  const payload = new FormData();
  payload.append("name", meal.name ?? "");
  payload.append("description", meal.description ?? "");
  payload.append("category", toApiCategory(meal.category));
  payload.append("price", String(Number(meal.price ?? 0)));
  payload.append("available", String(Boolean(meal.available)));

  if (meal.image instanceof File) {
    payload.append("image", meal.image);
  }

  const { data } = await api.request({
    method,
    url,
    data: payload,
  });

  return data?.data ?? data;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const queryClient = useQueryClient();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const { data: menuData } = useMenu();
  const { data: adminMealsData } = useQuery({
    queryKey: ["admin", "meals"],
    queryFn: async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
      if (!token) {
        return undefined;
      }

      try {
        const { data } = await api.get("/meals/meals/", {
          params: { page_size: 100 },
        });
        return normalizeMealsPayload(data?.data ?? data);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("401") || message.includes("403")) {
          toast.error("Please sign in again to access the admin meal list.");
        }
        return undefined;
      }
    },
    enabled: isAdminRoute,
    retry: false,
  });

  useEffect(() => {
    const sourceMeals = isAdminRoute
      ? (adminMealsData && adminMealsData.length > 0 ? adminMealsData : menuData)
      : menuData;

    if (Array.isArray(sourceMeals)) {
      setMeals(sourceMeals.map((meal) => formatMeal(meal)));
    }
  }, [adminMealsData, isAdminRoute, menuData]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const addToCart = useCallback((meal: Meal) => {
    setCart((prev) => {
      const found = prev.find((i) => i.meal.id === meal.id);
      if (found)
        return prev.map((i) =>
          i.meal.id === meal.id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { meal, qty: 1 }];
    });
  }, []);

  const value = useMemo<AppState>(() => {
    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + i.qty * i.meal.price, 0);

    const formatOrder = (order: any): Order => ({
      id: String(order.id),
      ticket: order.ticket_number,
      phone: order.phone_number,
      amount: Number(order.total_amount),
      status: order.collection_status === "collected" ? "collected" : "pending",
      placedAt: order.created_at
        ? new Date(order.created_at).toLocaleTimeString("en-KE", {
            hour: "numeric",
            minute: "2-digit",
          })
        : undefined,
      items: (order.items ?? []).map((item: any) => ({
        name: item.meal_name ?? item.name ?? "",
        qty: Number(item.quantity ?? item.qty ?? 0),
        price: Number(item.unit_price ?? item.price ?? 0),
      })),
    });

    return {
      meals,
      addMeal: async (meal) => {
        const created = await postMeal("/meals/", meal, "post");
        setMeals((prev) => [formatMeal(created), ...prev]);
      },
      updateMeal: async (meal) => {
        const updated = await postMeal(`/meals/${meal.id}/`, meal, "patch");
        setMeals((prev) => prev.map((m) => (m.id === meal.id ? formatMeal(updated) : m)));
      },
      deleteMeal: async (id) => {
        await api.delete(`/meals/${id}/`);
        setMeals((prev) => prev.filter((m) => m.id !== id));
      },
      toggleAvailability: async (id) => {
        const current = meals.find((m) => m.id === id);
        if (!current) return;

        const { data } = await api.patch(`/meals/${id}/availability/`, {
          available: !current.available,
        });
        const updated = data?.data ?? data;
        setMeals((prev) => prev.map((m) => (m.id === id ? formatMeal(updated) : m)));
      },
      cart,
      addToCart,
      setQty: (id, qty) =>
        setCart((prev) =>
          qty <= 0
            ? prev.filter((i) => i.meal.id !== id)
            : prev.map((i) => (i.meal.id === id ? { ...i, qty } : i)),
        ),
      removeFromCart: (id) =>
        setCart((prev) => prev.filter((i) => i.meal.id !== id)),
      clearCart: () => setCart([]),
      cartCount,
      cartTotal,
      orders,
      placeOrder: async (phone) => {
        const payload = cart.map((i) => ({ meal_id: Number(i.meal.id), quantity: i.qty }));
        const resp = await apiCreateOrder(phone, payload);
        if (!resp?.order) {
          throw new Error("Order creation failed. Please try again.");
        }

        const serverOrder = formatOrder(resp.order);
        setOrders((prev) => [serverOrder, ...prev.filter((o) => o.id !== serverOrder.id)]);
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
        return serverOrder;
      },
      markCollected: (id) =>
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "collected" } : o)),
        ),
      theme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    };
  }, [meals, cart, orders, theme, addToCart]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
