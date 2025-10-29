"use client";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/auth/changePassword-v2.module.scss";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

const ChangePasswordPage = () => {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [rePassword_hash, setRePassword_hash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  // Send OTP when page loads
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      setForm((prev) => ({ ...prev, email }));
      // Auto send OTP on page load
      // sendOTP(email);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Function to send OTP
  const sendOTP = async (email: string) => {
    try {
      setLoading(true);
      await axios.get(`http://localhost:8080/api/auth/mailResetPassword`, {
        params: { email },
      });
      setCountdown(60); // Start 60s countdown
    } catch (err) {
      console.error(err);
      setErrorMessage("Không thể gửi mã OTP, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };
  // show password
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  // validate
  const isValidLength = form.password.length >= 8 && form.password.length <= 32;
  const hasNumber = /\d/.test(form.password);
  const hasUpperCase = /[A-Z]/.test(form.password);
  const hasLowerCase = /[a-z]/.test(form.password);
  const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  //Bấm xác nhận

  const handleBtn = async () => {
    if (!form.password || !form.otp || !rePassword_hash) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (form.password != rePassword_hash) {
      setErrorMessage("Mật khẩu nhập lại không khớp!");
      return;
    }
    if (!isValidLength || !hasNumber || !hasUpperCase || !hasLowerCase) {
      setErrorMessage("Mật khẩu không đúng định dạng!");
      return;
    }
    if (!validateEmail) {
      setErrorMessage("Email không hợp lệ!");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage("");
      await axios.post(
        "http://localhost:8080/api/auth/verifyResetPassword",
        form,
        { withCredentials: true }
      );
      setSuccessMessage(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorMessage("Sai OTP");
      } else if (err.response?.status === 400) {
        setErrorMessage(err.response?.data?.message || "Có lỗi xảy ra");
      } else {
        console.error(err);
        setErrorMessage("Có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBtnResend = async () => {
    if (countdown > 0) return; // Prevent resend if countdown is active

    try {
      setLoading(true);
      setErrorMessage("");
      setResendSuccess(false);
      await axios.get(`http://localhost:8080/api/auth/mailResetPassword`, {
        params: { email: form.email },
      });
      setResendSuccess(true);
      setCountdown(60); // Start 60s countdown
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Không thể gửi lại mã, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.gradientBorder}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>Đổi lại mật khẩu</h1>
            <p className={styles.subtitle}>
              Mã xác nhận OTP đã được gửi đến
              <br />
              <span className={styles.emailBadge}>{form.email}</span>
            </p>
          </div>

          {successMessage ? (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <h3 className={styles.successTitle}>Đổi mật khẩu thành công!</h3>
              <p className={styles.successText}>
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            </div>
          ) : (
            <>
              {/* Password Input */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mật khẩu mới</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputInner}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      className={styles.input}
                      value={form.password}
                      name="password"
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
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
              </div>

              {/* Confirm Password Input */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Xác nhận mật khẩu</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputInner}>
                    <input
                      type={showRePassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      className={styles.input}
                      value={rePassword_hash}
                      name="rePassword_hash"
                      onChange={(e) => {
                        setRePassword_hash(e.target.value);
                        setErrorMessage("");
                      }}
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowRePassword(!showRePassword)}
                      aria-label="Toggle password visibility"
                    >
                      <Icon
                        icon={showRePassword ? "mdi:eye" : "mdi:eye-off"}
                        style={{ color: "#D5D5DF" }}
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Validation */}
              <div className={styles.validationGrid}>
                <div
                  className={`${styles.validationItem} ${
                    isValidLength ? styles.valid : styles.invalid
                  }`}
                >
                  <Image
                    src={
                      isValidLength
                        ? "/image/register/VectorCheckOn.svg"
                        : "/image/register/VectorCheckOff.svg"
                    }
                    alt="check"
                    className={styles.checkIcon}
                    width={20}
                    height={20}
                  />
                  <span>Giới hạn từ 8-32 ký tự</span>
                </div>
                <div
                  className={`${styles.validationItem} ${
                    hasNumber ? styles.valid : styles.invalid
                  }`}
                >
                  <Image
                    src={
                      hasNumber
                        ? "/image/register/VectorCheckOn.svg"
                        : "/image/register/VectorCheckOff.svg"
                    }
                    alt="check"
                    className={styles.checkIcon}
                    width={20}
                    height={20}
                  />
                  <span>Tối thiểu 01 chữ số</span>
                </div>
                <div
                  className={`${styles.validationItem} ${
                    hasUpperCase ? styles.valid : styles.invalid
                  }`}
                >
                  <Image
                    src={
                      hasUpperCase
                        ? "/image/register/VectorCheckOn.svg"
                        : "/image/register/VectorCheckOff.svg"
                    }
                    alt="check"
                    className={styles.checkIcon}
                    width={20}
                    height={20}
                  />
                  <span>Tối thiểu 01 ký tự IN HOA</span>
                </div>
                <div
                  className={`${styles.validationItem} ${
                    hasLowerCase ? styles.valid : styles.invalid
                  }`}
                >
                  <Image
                    src={
                      hasLowerCase
                        ? "/image/register/VectorCheckOn.svg"
                        : "/image/register/VectorCheckOff.svg"
                    }
                    alt="check"
                    className={styles.checkIcon}
                    width={20}
                    height={20}
                  />
                  <span>Tối thiểu 01 ký tự in thường</span>
                </div>
              </div>

              {/* OTP Section */}
              <div className={styles.otpSection}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Mã OTP</label>
                  <div className={styles.otpInputWrapper}>
                    <div className={styles.otpInputInner}>
                      <input
                        type="text"
                        placeholder="Nhập mã OTP"
                        className={styles.otpInput}
                        value={form.otp}
                        name="otp"
                        onChange={handleChange}
                        maxLength={6}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.btnResend}
                  onClick={handleBtnResend}
                  disabled={loading || countdown > 0}
                >
                  <div className={styles.btnResendInner}>
                    <span className={styles.btnResendText}>
                      {countdown > 0
                        ? `Gửi lại (${countdown}s)`
                        : loading
                          ? "Đang gửi..."
                          : "Gửi lại mã"}
                    </span>
                  </div>
                </button>
              </div>

              {/* Resend Success Message */}
              {resendSuccess && (
                <div className={styles.successMessage}>
                  <div className={styles.successIcon}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  <h3 className={styles.successTitle}>Gửi mã thành công!</h3>
                  <p className={styles.successText}>
                    Mã OTP mới đã được gửi đến email {form.email}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className={styles.errorMessage}>{errorMessage}</div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleBtn}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
              </button>

              {/* Back to Login */}
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => router.push("/auth/login")}
                disabled={loading}
              >
                <div className={styles.btnSecondaryInner}>
                  <div className={styles.btnSecondaryText}>
                    <Icon
                      icon={"formkit:arrowleft"}
                      style={{
                        color: "linear-gradient(135deg, #3b82f6, #10b981)",
                      }}
                    />
                    <p>Quay lại đăng nhập</p>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
