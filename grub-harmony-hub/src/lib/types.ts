export type Meal = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string | null;
  rating?: number;
  available?: boolean;
};

export type OrderItem = { name: string; qty: number; price: number };

export type Order = {
  id: string;
  ticket?: string;
  phone?: string;
  amount: number;
  status?: "pending" | "collected";
  placedAt?: string;
  items: OrderItem[];
};
