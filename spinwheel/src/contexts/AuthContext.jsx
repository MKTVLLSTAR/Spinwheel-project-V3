import { createContext, useContext, useState, useEffect } from "react";
import {
  authAPI,
  setAuthToken,
  getAuthToken,
  isAuthenticated,
} from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (isAuthenticated()) {
        const response = await authAPI.getProfile();
        setAdmin(response.data.admin);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);

      const { token, admin: adminData } = response.data;

      // Store token
      setAuthToken(token);

      // Update state
      setAdmin(adminData);
      setIsLoggedIn(true);

      toast.success("เข้าสู่ระบบสำเร็จ");
      return { success: true, admin: adminData };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setAdmin(null);
    setIsLoggedIn(false);
    toast.success("ออกจากระบบแล้ว");
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      setAuthToken(response.data.token);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return false;
    }
  };

  const value = {
    admin,
    loading,
    isLoggedIn,
    login,
    logout,
    refreshToken,
    isAuthenticated: () => isLoggedIn,
    isSuperAdmin: () => admin?.role === "superadmin",
    isAdmin: () => admin?.role === "admin" || admin?.role === "superadmin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
