/**
 * Utility functions để kiểm tra authentication
 */

/**
 * Kiểm tra xem user có đang đăng nhập hợp lệ không
 * @returns true nếu có cả user và token
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  const user = localStorage.getItem("user");
  const token = localStorage.getItem("access_token");

  return !!(user && token);
};

/**
 * Lấy thông tin user hiện tại
 * @returns User object hoặc null
 */
export const getCurrentUser = (): any | null => {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

/**
 * Lấy access token
 * @returns Token string hoặc null
 */
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

/**
 * Xóa tất cả dữ liệu authentication
 */
export const clearAuthData = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("user_logged_out"));
};
