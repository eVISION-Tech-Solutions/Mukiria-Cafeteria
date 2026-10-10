import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Order } from "@/lib/types";

const formatAdminOrder = (order: any): Order => ({
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

export const fetchAdminOrders = async () => {
  const res = await api.get("/orders/");
  const data = res.data?.data ?? res.data;
  const orders = Array.isArray(data) ? data : data?.results ?? [];
  return Array.isArray(orders) ? orders.map(formatAdminOrder) : [];
};

export const verifyTicket = async (ticket: string) => {
  const res = await api.post("/orders/verify/", { ticket_number: ticket });
  return res.data?.data ?? res.data;
};

export const useAdminOrders = () => {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "orders"], queryFn: fetchAdminOrders });

  const mutation = useMutation({ mutationFn: (ticket: string) => verifyTicket(ticket), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "orders"] }) });

  return { ...query, verifyTicketMutation: mutation };
};
