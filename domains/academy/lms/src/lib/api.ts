import axios from "axios";
import { disconnectChatSocket } from "@/features/chat/chatSocket";

const rawBaseUrl = import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com";
const normalizedBaseUrl = rawBaseUrl.endsWith("/api/v1")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, "")}/api/v1`;

const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRedirecting = false;

/** Clears all auth data from storage and disconnects active realtime sessions. Safe to call from anywhere. */
export const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("auth_provider");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");

  try {
    disconnectChatSocket();
  } catch (err) {
    console.warn("Failed to cleanly disconnect chat socket during clearAuth:", err);
  }
};

// Interceptor to add token to requests and normalize routes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.url) {
    // Strip redundant leading /api/v1/academy, /api/v1, or /academy prefixes
    config.url = config.url
      .replace(/^\/api\/v1\/academy(?:\/|$)/, "/")
      .replace(/^\/api\/v1(?:\/|$)/, "/")
      .replace(/^\/academy(?:\/|$)/, "/");
  }
  return config;
});

// Interceptor to handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();

      const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.some(
        (p) => currentPath === p || currentPath.startsWith(`${p}/`)
      );

      if (!isPublicPath && !isRedirecting) {
        isRedirecting = true;
        const redirectParam = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `/login?expired=1&redirect=${redirectParam}`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;

