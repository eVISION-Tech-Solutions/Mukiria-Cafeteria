import api from "@/lib/api";
import type { OrderItem, Order } from "@/lib/types";

export const createOrder = async (
  phone: string,
  items: { meal_id: number | string; quantity: number }[],
) => {
  const res = await api.post("/orders/create/", {
    phone_number: phone,
    items,
    paid: true,
  });
  return res.data?.data ?? res.data;
};

export type CreateOrderResponse = {
  order: Order;
  payment?: unknown;
};
