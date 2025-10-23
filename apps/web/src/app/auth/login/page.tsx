"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleLogin from "@/styles/pages/auth/login-v2.module.scss";
import axios from "axios";
import { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

export default function Login() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password_hash: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when user types
  };

  const handleBtn = async () => {
    if (!form.email || !form.password_hash) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        "http://localhost:8080/api/auth/login",
        form,
        { withCredentials: true }
      );

      const data = res.data;

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      // Fetch user info
      const token = localStorage.getItem("access_token");
      const userRes = await axios.get(
        `http://localhost:8080/api/users/find/${form.email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      localStorage.setItem("user", JSON.stringify(userRes.data));

      const userStr = localStorage.getItem("user");
      let user;
      if (userStr) {
        user = JSON.parse(userStr);
      }

      if (user.status == "active") {
        if (user.role == "admin") {
          router.push("/admin/users");
        } else {
          router.push("/");
        }
      } else {
        setError("Tài khoản chưa được xác thực");
        localStorage.setItem("email", form.email);
        setTimeout(() => router.push("/auth/verification"), 2000);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(
          err.response?.data?.message || "Email hoặc mật khẩu không đúng"
        );
      } else if (err.response?.status === 401) {
        setError(
          err.response?.data?.message ||
            "Phiên đăng nhập đã kết thúc vui lòng đăng nhập lại"
        );
      } else {
        console.error(err);
        setError("Có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleBtn();
    }
  };

  return (
    <div className={styleLogin["container"]}>
      <div className={styleLogin["loginCard"]}>
        {/* Header with Logo and Title */}
        <div className={styleLogin["header"]}>
          <h1>Đăng nhập</h1>
          <p>Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styleLogin["alertError"]} role="alert">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form
          className={styleLogin["form"]}
          onSubmit={(e) => {
            e.preventDefault();
            handleBtn();
          }}
        >
          {/* Email Input */}
          <div className={styleLogin["formGroup"]}>
            <label htmlFor="email">Email hoặc số điện thoại</label>
            <div className={styleLogin["inputWrapper"]}>
              <input
                id="email"
                type="text"
                placeholder="Nhập email hoặc số điện thoại"
                className={styleLogin["input"]}
                value={form.email}
                name="email"
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                aria-required="true"
                aria-label="Email hoặc số điện thoại"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className={styleLogin["formGroup"]}>
            <label htmlFor="password">Mật khẩu</label>
            <div className={styleLogin["passwordWrapper"]}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                className={styleLogin["input"]}
                value={form.password_hash}
                name="password_hash"
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={loading}
                aria-required="true"
                aria-label="Mật khẩu"
              />
              <button
                type="button"
                className={styleLogin["togglePassword"]}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <Icon
                  icon={showPassword ? "mdi:eye" : "mdi:eye-off"}
                  style={{ color: "#D5D5DF" }}
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className={styleLogin["forgotPassword"]}>
            <Link href="/auth/forgotPassword/confirmEmail">Quên mật khẩu?</Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className={`${styleLogin["loginButton"]} ${loading ? styleLogin["loading"] : ""}`}
            disabled={loading}
            title="Đăng nhập"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* Divider */}
        <div className={styleLogin["divider"]}>
          <span>Hoặc đăng nhập bằng</span>
        </div>

        {/* Social Login Buttons */}
        <div className={styleLogin["socialLogin"]}>
          <button
            type="button"
            className={styleLogin["socialButton"]}
            title="Đăng nhập với Google"
            aria-label="Đăng nhập với Google"
          >
            <Image
              src="/image/login/IconGoogle.png"
              alt="Google"
              width={20}
              height={20}
            />
            <span>Google</span>
          </button>
          <button
            type="button"
            className={styleLogin["socialButton"]}
            title="Đăng nhập với Facebook"
            aria-label="Đăng nhập với Facebook"
          >
            <Image
              src="/image/login/IconFacebook.png"
              alt="Facebook"
              width={20}
              height={20}
            />
            <span>Facebook</span>
          </button>
        </div>

        {/* Register Link */}
        <div className={styleLogin["register"]}>
          Chưa có tài khoản?
          <Link href="/auth/register">Đăng ký tài khoản mới</Link>
        </div>
      </div>
    </div>
  );
}
