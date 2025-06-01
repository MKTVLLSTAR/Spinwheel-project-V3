import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

// API Base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

    // Handle different error status codes
    if (error.response?.status === 401) {
      // Unauthorized - remove token and redirect to login
      Cookies.remove("admin_token");
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin/login";
      }
      toast.error("กรุณาเข้าสู่ระบบใหม่");
    } else if (error.response?.status === 403) {
      toast.error("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
    } else if (error.response?.status === 429) {
      toast.error("คำขอมากเกินไป กรุณารอสักครู่");
    } else if (error.response?.status >= 500) {
      toast.error("เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ภายหลัง");
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getAll: async () => {
    const response = await api.get("/admin");
    return response.data;
  },

  create: async (adminData) => {
    const response = await api.post("/admin", adminData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/${id}`);
    return response.data;
  },

  updatePassword: async (id, password) => {
    const response = await api.patch(`/admin/${id}/password`, { password });
    return response.data;
  },
};

// Prize API
export const prizeAPI = {
  getAll: async () => {
    const response = await api.get("/prizes");
    return response.data;
  },

  updateAll: async (prizes) => {
    const response = await api.put("/prizes", { prizes });
    return response.data;
  },

  initialize: async () => {
    const response = await api.post("/prizes/initialize");
    return response.data;
  },
};

// Token API
export const tokenAPI = {
  create: async (quantity = 1) => {
    const response = await api.post("/tokens", { quantity });
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get("/tokens", { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/tokens/stats");
    return response.data;
  },

  validate: async (code) => {
    const response = await api.post("/tokens/validate", { code });
    return response.data;
  },

  deleteExpired: async () => {
    const response = await api.delete("/tokens/expired");
    return response.data;
  },
};

// Spin API
export const spinAPI = {
  spin: async (tokenCode) => {
    const response = await api.post("/spin/spin", { tokenCode });
    return response.data;
  },

  getResults: async (params = {}) => {
    const response = await api.get("/spin/results", { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/spin/stats");
    return response.data;
  },
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    Cookies.set("admin_token", token, { expires: 1 }); // 1 day
  } else {
    Cookies.remove("admin_token");
  }
};

export const getAuthToken = () => {
  return Cookies.get("admin_token");
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default api;
