import axios from "axios";

// Development requests go through Vite's /api proxy to the configured API server.
const DEFAULT_API_URL =
  import.meta.env.MODE === "production"
    ? "https://pos-server-backend.onrender.com/api"
    : "/api";

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL || DEFAULT_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "null");

      if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch (error) {
      console.error("[Axios Interceptor] Failed to parse auth token:", error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;