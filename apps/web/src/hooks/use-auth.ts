import { useState, useEffect } from "react";

interface User {
  _id: string;
  email: string;
  full_name: string;
  role: string;
  phone_number?: string;
  address?: string;
  description?: string;
  avatar_url?: string;
  status?: string;
}

/**
 * Custom hook để quản lý trạng thái đăng nhập
 * @returns {Object} - Trạng thái user, loading, và các hàm helper
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Kiểm tra localStorage khi component mount
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("access_token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Lỗi khi đọc thông tin xác thực:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Lắng nghe sự thay đổi của localStorage (cho trường hợp đăng nhập/đăng xuất từ tab khác)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * Đăng xuất người dùng
   */
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Làm mới thông tin user từ localStorage
   */
  const refreshUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (error) {
      console.error("Lỗi khi làm mới thông tin user:", error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    refreshUser,
  };
}
