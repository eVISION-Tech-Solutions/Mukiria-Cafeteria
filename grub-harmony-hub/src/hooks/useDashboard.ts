import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getTodayKey = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

export type DashboardData = {
  today_revenue: string;
  today_orders: number;
  pending_collections: number;
  collected_orders: number;
  meals_sold_today: number;
  recent_orders: any[];
  revenue_trend: { label: string; revenue: number; orders: number }[];
  top_meals: { name: string; sold: number }[];
  combinations: { pair: string; count: number }[];
  category_sales: { name: string; value: number }[];
  peak_hours: { hour: string; orders: number }[];
  best_day?: string;
  best_day_value?: string;
  best_meal?: string;
  best_meal_sold?: string;
  busiest_hour?: string;
  busiest_hour_orders?: string;
};

export const fetchDashboard = async (): Promise<DashboardData> => {
  const res = await api.get("/orders/dashboard/");
  return res.data?.data ?? res.data;
};

export const useDashboard = () => {
  const [todayKey, setTodayKey] = useState(getTodayKey());

  useEffect(() => {
    const syncTodayKey = () => {
      const nextKey = getTodayKey();
      setTodayKey((currentKey) => (currentKey === nextKey ? currentKey : nextKey));
    };

    syncTodayKey();

    const intervalId = window.setInterval(syncTodayKey, 1000 * 60);
    const handleFocus = () => syncTodayKey();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncTodayKey();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return useQuery({
    queryKey: ["dashboard", todayKey],
    queryFn: fetchDashboard,
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};
