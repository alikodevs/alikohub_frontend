import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com",
  headers: {
    "Content-Type": "application/json",
  },
});

/** Clears all auth data from localStorage. Safe to call from anywhere. */
export const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("auth_provider");
};

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
