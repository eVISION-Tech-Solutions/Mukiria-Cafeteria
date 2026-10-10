import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

type LoginPayload = { username: string; password: string };

export const login = async (payload: LoginPayload) => {
  const res = await api.post("/auth/login/", payload);
  return res.data?.data ?? res.data;
};

export const useLogin = () =>
  useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const data = await login(payload);
      if (data?.tokens?.access) {
        try {
          localStorage.setItem("access_token", data.tokens.access);
          localStorage.setItem("refresh_token", data.tokens.refresh);
          // Also set cookies so the server can read tokens during SSR
          try {
            document.cookie = `access_token=${data.tokens.access}; Path=/; SameSite=Lax`;
            document.cookie = `refresh_token=${data.tokens.refresh}; Path=/; SameSite=Lax`;
          } catch (e) {}
        } catch (e) {}
      }
      return data;
    },
  });

export const logout = async (refresh: string) => {
  const res = await api.post("/auth/logout/", { refresh });
  return res.data?.data ?? res.data;
};

export const useLogout = () =>
  useMutation({
    mutationFn: async () => {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token available.");
      const data = await logout(refresh);
      try {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        document.cookie = "access_token=; Path=/; max-age=0";
        document.cookie = "refresh_token=; Path=/; max-age=0";
      } catch (e) {
        // ignore
      }
      return data;
    },
  });
