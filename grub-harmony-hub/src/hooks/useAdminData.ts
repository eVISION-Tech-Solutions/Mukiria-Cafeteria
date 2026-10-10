import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const fetchOrders = async () => {
  const res = await api.get("/meals/meals/");
  return res.data?.data ?? res.data;
};

export const useOrders = () => useQuery({ queryKey: ["meals"], queryFn: fetchOrders });
