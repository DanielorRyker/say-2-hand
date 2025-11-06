import axios from "axios";
import { API_BASE } from "./constants";

// ====================================================
// TẠO AXIOS INSTANCE MỚI với interceptors
// ====================================================
const axiosInstance = axios.create({
  baseURL: `${API_BASE}/api`, // Base URL cho tất cả requests
  timeout: 10000, // 10 giây timeout
});

// ====================================================
// REQUEST INTERCEPTOR - Tự động gắn token
// ====================================================
axiosInstance.interceptors.request.use(
  (config) => {
    // Tự động thêm Authorization header nếu có token
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;

        // Debug logging
        console.log("🔑 Request interceptor:", {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ====================================================
// RESPONSE INTERCEPTOR - Xử lý 401
// ====================================================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Xóa token và user data đã hết hạn
      if (typeof window !== "undefined") {
        const hadToken = localStorage.getItem("access_token");
        const hadUser = localStorage.getItem("user");

        // Chỉ xóa và dispatch event nếu có data cũ
        if (hadToken || hadUser) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          // Dispatch event để các component biết user đã logout
          window.dispatchEvent(new Event("user_logged_out"));
          console.log("🔒 Token hết hạn - Đã xóa dữ liệu đăng nhập");
        }
      }
    }
    return Promise.reject(error);
  }
);

// ====================================================
// EXPORT DEFAULT - Components sẽ dùng instance này
// ====================================================
export default axiosInstance;

// ====================================================
// NAMED EXPORT apiClient - Nếu có code cũ đang dùng
// ====================================================
export const apiClient = axiosInstance; // Alias cho compatibility
