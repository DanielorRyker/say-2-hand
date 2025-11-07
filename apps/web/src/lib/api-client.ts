import axios from "axios";
import { API_BASE } from "./constants";

// Tạo axios instance với config
export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Response interceptor để xử lý lỗi
apiClient.interceptors.response.use(
  (response) => {
    // Kiểm tra nếu response không phải JSON
    const contentType = response.headers["content-type"];
    if (contentType && !contentType.includes("application/json")) {
      console.error("API returned non-JSON response:", contentType);
      throw new Error("Invalid response format");
    }
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("No response from server:", error.request);
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);
