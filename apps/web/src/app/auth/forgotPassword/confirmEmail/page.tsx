"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/pages/auth/forgotPassword-v2.module.scss";
import axios from "axios";
import { useState } from "react";
import { API_BASE } from "@/lib/constants";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(""); // Clear error when user types
  };

  const handleSubmit = async () => {
    // Validation
    if (!email || email.trim() === "") {
      setError("Vui lòng nhập email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if email exists
      const existRes = await axios.get(
        `${API_BASE}/api/users/exist/${email}`
      );

      if (existRes.data !== true) {
        setError("Email không tồn tại trong hệ thống");
        setLoading(false);
        return;
      }

      // Send OTP email
      await axios.get(`${API_BASE}/api/auth/mailResetPassword`, {
        params: { email },
      });

      // Store email and show success
      localStorage.setItem("email", email);
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/auth/forgotPassword/changePassword");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      if (err.response?.status === 404) {
        setError("Email không tồn tại trong hệ thống");
      } else {
        setError("Có lỗi xảy ra, vui lòng thử lại sau");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && !success) {
      handleSubmit();
    }
  };

  const handleBackToLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["gradientBorder"]}>
        <div className={styles["card"]}>
          {/* Header with Icon */}
          <div className={styles["header"]}>
            <h1>Quên mật khẩu?</h1>
            <p>
              Hãy nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật
              khẩu.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={styles["alertError"]} role="alert">
              {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className={styles["alertSuccess"]} role="alert">
              Mã OTP đã được gửi đến email của bạn. Đang chuyển hướng...
            </div>
          )}

          {/* Form */}
          <form
            className={styles["form"]}
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            {/* Email Input */}
            <div className={styles["formGroup"]}>
              <label htmlFor="email">Email</label>
              <div className={styles["inputWrapper"]}>
                <input
                  id="email"
                  type="email"
                  placeholder="Nhập email đã đăng ký"
                  value={email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  disabled={loading || success}
                  aria-required="true"
                  aria-label="Email"
                  className={error ? styles["error"] : ""}
                />
              </div>
            </div>

            {/* Button Group */}
            <div
              className={`${styles["buttonGroup"]} ${loading ? styles["loading"] : ""}`}
            >
              <button
                type="submit"
                className={styles["submitButton"]}
                disabled={loading || success}
                title="Gửi mã OTP"
              >
                {loading
                  ? "Đang gửi..."
                  : success
                    ? "Đã gửi mã OTP"
                    : "Gửi mã OTP"}
              </button>

              <button
                type="button"
                className={styles["backButton"]}
                onClick={handleBackToLogin}
                disabled={loading}
                title="Quay lại đăng nhập"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>

          {/* Info Section */}
          <div className={styles["infoSection"]}>
            <p className={styles["infoText"]}>
              Chưa nhận được mã? Kiểm tra hộp thư spam hoặc thử lại sau vài
              phút.
            </p>
            <div className={styles["helpLinks"]}>
              <Link href="/auth/register">Đăng ký tài khoản mới</Link>
              <Link href="/help">Trợ giúp</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
