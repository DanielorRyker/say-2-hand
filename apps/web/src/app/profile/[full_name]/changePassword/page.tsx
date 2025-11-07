"use client";
import { useRouter } from "next/navigation";
import styleChangePassword from "@/styles/pages/auth/changePassword-v2.module.scss";
import { useEffect, useState } from "react";
import Image from "next/image";
import { apiClient } from "@/lib/api-client";

const ChangePasswordPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [rePassword, setRePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number: string;
    address: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setForm((prev) => ({
        ...prev,
        email: parsedUser.email,
      }));
    }
  }, []);

  if (!mounted) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  // Validation checks
  const checkIcons = {
    on: "/image/register/VectorCheckOn.svg",
    off: "/image/register/VectorCheckOff.svg",
  };

  const isValidLength = form.password.length >= 8 && form.password.length <= 32;
  const hasNumber = /\d/.test(form.password);
  const hasUpperCase = /[A-Z]/.test(form.password);
  const hasLowerCase = /[a-z]/.test(form.password);
  const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const handleConfirm = async () => {
    setErrorMessage("");

    if (!form.password || !form.otp || !rePassword) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (form.password !== rePassword) {
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
      await apiClient.post("/auth/verifyResetPassword", form);
      setIsSuccess(true);
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
    }
  };

  const handleResendOTP = async () => {
    try {
      await apiClient.get("/auth/mailResetPassword", {
        params: { email: form.email },
      });
      alert("Mã OTP đã được gửi lại tới email: " + form.email);
    } catch (error) {
      console.error(error);
      setErrorMessage("Không thể gửi lại mã OTP");
    }
  };

  const handleBack = () => {
    router.push("/profile/" + user?.full_name);
  };

  return (
    <div className={styleChangePassword["container"]}>
      <div className={styleChangePassword["gradientBorder"]}>
        <div className={styleChangePassword["card"]}>
          {/* Header */}
          <div className={styleChangePassword["header"]}>
            <h1 className={styleChangePassword["title"]}>Đổi mật khẩu</h1>
            <p className={styleChangePassword["subtitle"]}>
              Mã xác nhận OTP sẽ được gửi đến
            </p>
            <div className={styleChangePassword["emailBadge"]}>
              {form.email}
            </div>
          </div>

          {!isSuccess ? (
            <>
              {/* Password Input */}
              <div className={styleChangePassword["inputGroup"]}>
                <label className={styleChangePassword["label"]}>
                  Mật khẩu mới
                </label>
                <div className={styleChangePassword["inputWrapper"]}>
                  <div className={styleChangePassword["inputInner"]}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      className={styleChangePassword["input"]}
                      value={form.password}
                      name="password"
                      onChange={handleChange}
                    />
                    <button
                      className={styleChangePassword["eyeButton"]}
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      aria-label="Toggle password visibility"
                    >
                      <Image
                        src={
                          showPassword
                            ? "/image/login/mdi_eye_on.svg"
                            : "/image/login/mdi_eye-off.svg"
                        }
                        alt="Toggle"
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className={styleChangePassword["inputGroup"]}>
                <label className={styleChangePassword["label"]}>
                  Xác nhận mật khẩu
                </label>
                <div className={styleChangePassword["inputWrapper"]}>
                  <div className={styleChangePassword["inputInner"]}>
                    <input
                      type={showRePassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      className={styleChangePassword["input"]}
                      value={rePassword}
                      onChange={(e) => {
                        setRePassword(e.target.value);
                        setErrorMessage("");
                      }}
                    />
                    <button
                      className={styleChangePassword["eyeButton"]}
                      onClick={() => setShowRePassword(!showRePassword)}
                      type="button"
                      aria-label="Toggle password visibility"
                    >
                      <Image
                        src={
                          showRePassword
                            ? "/image/login/mdi_eye_on.svg"
                            : "/image/login/mdi_eye-off.svg"
                        }
                        alt="Toggle"
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Validation */}
              <div className={styleChangePassword["validationGrid"]}>
                <div
                  className={`${styleChangePassword["validationItem"]} ${
                    isValidLength
                      ? styleChangePassword["valid"]
                      : styleChangePassword["invalid"]
                  }`}
                >
                  <Image
                    src={isValidLength ? checkIcons.on : checkIcons.off}
                    alt="check"
                    className={styleChangePassword["checkIcon"]}
                    width={20}
                    height={20}
                  />
                  <span>Giới hạn 8-32 ký tự</span>
                </div>
                <div
                  className={`${styleChangePassword["validationItem"]} ${
                    hasNumber
                      ? styleChangePassword["valid"]
                      : styleChangePassword["invalid"]
                  }`}
                >
                  <Image
                    src={hasNumber ? checkIcons.on : checkIcons.off}
                    alt="check"
                    className={styleChangePassword["checkIcon"]}
                    width={20}
                    height={20}
                  />
                  <span>Tối thiểu 01 chữ số</span>
                </div>
                <div
                  className={`${styleChangePassword["validationItem"]} ${
                    hasUpperCase
                      ? styleChangePassword["valid"]
                      : styleChangePassword["invalid"]
                  }`}
                >
                  <Image
                    src={hasUpperCase ? checkIcons.on : checkIcons.off}
                    alt="check"
                    className={styleChangePassword["checkIcon"]}
                    width={20}
                    height={20}
                  />
                  <span>Tối thiểu 01 ký tự IN HOA</span>
                </div>
                <div
                  className={`${styleChangePassword["validationItem"]} ${
                    hasLowerCase
                      ? styleChangePassword["valid"]
                      : styleChangePassword["invalid"]
                  }`}
                >
                  <Image
                    src={hasLowerCase ? checkIcons.on : checkIcons.off}
                    alt="check"
                    className={styleChangePassword["checkIcon"]}
                    width={20}
                    height={20}
                  />
                  <span>Tối thiểu 01 ký tự in thường</span>
                </div>
              </div>

              {/* OTP Section */}
              <div className={styleChangePassword["otpSection"]}>
                <div className={styleChangePassword["otpInputWrapper"]}>
                  <div className={styleChangePassword["otpInputInner"]}>
                    <input
                      type="text"
                      placeholder="Nhập mã OTP"
                      className={styleChangePassword["otpInput"]}
                      value={form.otp}
                      name="otp"
                      onChange={handleChange}
                      maxLength={6}
                    />
                  </div>
                </div>

                <button
                  className={styleChangePassword["btnResend"]}
                  onClick={handleResendOTP}
                  type="button"
                >
                  <div className={styleChangePassword["btnResendInner"]}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    </svg>
                    <span className={styleChangePassword["btnResendText"]}>
                      Gửi lại
                    </span>
                  </div>
                </button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className={styleChangePassword["errorMessage"]}>
                  {errorMessage}
                </div>
              )}

              {/* Confirm Button */}
              <button
                className={styleChangePassword["btnPrimary"]}
                onClick={handleConfirm}
                type="button"
              >
                Xác nhận đổi mật khẩu
              </button>

              {/* Back Button */}
              <button
                className={styleChangePassword["btnSecondary"]}
                onClick={handleBack}
                type="button"
              >
                <div className={styleChangePassword["btnSecondaryInner"]}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                  </svg>
                  <span className={styleChangePassword["btnSecondaryText"]}>
                    Quay lại
                  </span>
                </div>
              </button>
            </>
          ) : (
            <div className={styleChangePassword["successMessage"]}>
              <div className={styleChangePassword["successIcon"]}>
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <h3 className={styleChangePassword["successTitle"]}>
                Đổi mật khẩu thành công!
              </h3>
              <p className={styleChangePassword["successText"]}>
                Đang chuyển hướng đến trang đăng nhập...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
