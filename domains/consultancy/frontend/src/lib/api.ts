import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const formatUploadUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  let formatted = url;
  if (formatted.includes("localhost:3006") || formatted.includes("localhost:")) {
    formatted = formatted.replace(/^https?:\/\/localhost:\d+/, API_BASE_URL);
  } else if (formatted.startsWith("/")) {
    formatted = `${API_BASE_URL}${formatted}`;
  }
  return formatted.replace("http://", "https://");
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Optional: redirect to login
    }
    return Promise.reject(error);
  },
);

export default api;
