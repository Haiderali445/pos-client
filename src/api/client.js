import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");

  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

export default apiClient;
