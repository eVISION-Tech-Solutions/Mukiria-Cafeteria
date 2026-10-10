import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
  },
});

// Attach Authorization header from localStorage when available (safe for SSR)
if (typeof window !== "undefined") {
  api.interceptors.request.use((config) => {
    try {
      const isAuthEndpoint = config.url?.includes("/auth/login/") || config.url?.includes("/auth/refresh/");
      if (isAuthEndpoint) {
        return config;
      }

      const token = localStorage.getItem("access_token");
      if (token && config.headers) {
        (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      try {
        const status = error?.response?.status;
        const message = error?.response?.data?.message ?? "";
        if (
          status === 401 ||
          message.toString().includes("Given token not valid for any token type") ||
          message.toString().includes("Token is invalid or expired")
        ) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          document.cookie = "access_token=; Path=/; max-age=0";
          document.cookie = "refresh_token=; Path=/; max-age=0";
        }
      } catch (e) {
        // ignore
      }
      return Promise.reject(error);
    },
  );
}

export default api;
