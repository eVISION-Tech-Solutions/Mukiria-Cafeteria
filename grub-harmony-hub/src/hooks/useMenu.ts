import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type MenuMeal = {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string | null;
  price: number;
};

export const fetchMenu = async (): Promise<MenuMeal[]> => {
  const res = await api.get("/menu/");
  // expecting success_response wrapper from backend -> { data: [...] }
  return res.data?.data ?? res.data;
};

export const useMenu = () => useQuery({ queryKey: ["menu"], queryFn: fetchMenu });
