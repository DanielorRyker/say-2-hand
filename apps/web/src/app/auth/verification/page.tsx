"use client";
import { useRouter } from "next/navigation";
import styleVerification from "@/styles/pages/auth/verification-v2.module.scss";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";

const Home = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  const [form, setForm] = useState({ email: "", otp: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Chỉ cho phép số
    if (value.length <= 6) {
      setForm({ ...form, otp: value });
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      setForm((prev) => ({ ...prev, email }));
    }
  }, []);

  //Bấm nút gửi lại mã
  const handleClick = async () => {
    if (!form.email) {
      alert("Không tìm thấy email. Vui lòng đăng ký lại.");
      router.push("/auth/register-v2");
      return;
    }

    try {
      await axios.get(`http://localhost:8080/api/auth/mail`, {
        params: { email: form.email },
      });

      setLoading(true);
      setSuccess(false);
      setCountdown(0);

      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setCountdown(60); // 60 giây
      }, 1000);
    } catch (error) {
      console.error("Error resending OTP:", error);
      alert("Không thể gửi lại mã. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && success) {
      setSuccess(false);
    }
  }, [countdown, success]);

  const isDisabled = loading || countdown > 0;

  // bấm nút xác nhận
  const handleBtn = async () => {
    if (!form.otp || form.otp.length !== 6) {
      alert("Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }

    if (!form.email) {
      alert("Không tìm thấy email. Vui lòng đăng ký lại.");
      router.push("/auth/register-v2");
      return;
    }

    try {
      setVerifying(true);
      await axios.post("http://localhost:8080/api/auth/verify", form, {
        withCredentials: true,
      });
      alert("Xác thực thành công! Bạn có thể đăng nhập ngay.");
      localStorage.removeItem("email"); // Xóa email sau khi verify thành công
      router.push("/auth/login");
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert("Mã OTP không đúng. Vui lòng kiểm tra lại.");
      } else if (err.response?.status === 400) {
        alert(err.response?.data?.message || "Mã OTP không hợp lệ");
      } else {
        console.error(err);
        alert("Có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={styleVerification["container"]}>
      {/* Animated background circles */}
      <div className={styleVerification["bgCircle1"]}></div>
      <div className={styleVerification["bgCircle2"]}></div>
      <div className={styleVerification["bgCircle3"]}></div>

      <div className={styleVerification["card"]}>
        {/* Header section with icon */}
        <div className={styleVerification["headerSection"]}>
          <div className={styleVerification["iconWrapper"]}>
            <Image
              src="/image/register/VectorCheckOn.svg"
              alt="Verification"
              width={60}
              height={60}
              className={styleVerification["icon"]}
            />
          </div>
          <h1 className={styleVerification["title"]}>Xác thực tài khoản</h1>
          <p className={styleVerification["subtitle"]}>
            Mã xác thực đã được gửi đến
          </p>
          <p className={styleVerification["emailDisplay"]}>
            {form.email || "..."}
          </p>
        </div>

        {/* OTP Input section */}
        <div className={styleVerification["otpSection"]}>
          <label htmlFor="otp-input" className={styleVerification["label"]}>
            Nhập mã xác thực (6 số)
          </label>
          <div className={styleVerification["inputWrapper"]}>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              className={styleVerification["otpInput"]}
              value={form.otp}
              name="otp"
              onChange={handleChange}
              maxLength={6}
              autoComplete="one-time-code"
            />
            <div className={styleVerification["inputIndicator"]}>
              {form.otp.length}/6
            </div>
          </div>
        </div>

        {/* Buttons section */}
        <div className={styleVerification["buttonSection"]}>
          <button
            className={`${styleVerification["btnPrimary"]} ${
              verifying || form.otp.length !== 6
                ? styleVerification["btnDisabled"]
                : ""
            }`}
            onClick={handleBtn}
            disabled={verifying || form.otp.length !== 6}
            type="button"
          >
            {verifying ? (
              <>
                <span className={styleVerification["spinner"]}></span>
                Đang xác thực...
              </>
            ) : (
              "Xác nhận"
            )}
          </button>

          <button
            className={`${styleVerification["btnSecondary"]} ${
              isDisabled ? styleVerification["btnDisabled"] : ""
            }`}
            onClick={handleClick}
            disabled={isDisabled}
            type="button"
          >
            {loading && (
              <>
                <span className={styleVerification["spinner"]}></span>
                Đang gửi...
              </>
            )}
            {!loading && countdown > 0 && (
              <>
                <Image
                  src="/image/register/VectorCheckOff.svg"
                  alt=""
                  width={20}
                  height={20}
                />
                Gửi lại sau {countdown}s
              </>
            )}
            {!loading && countdown === 0 && (
              <>
                <Image
                  src="/image/register/VectorCheckOn.svg"
                  alt=""
                  width={20}
                  height={20}
                />
                Gửi lại mã xác thực
              </>
            )}
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className={styleVerification["statusContainer"]}>
            <div className={styleVerification["successMessage"]}>
              <Image
                src="/image/register/VectorCheckOn.svg"
                alt="Success"
                width={20}
                height={20}
              />
              <span>Mã xác thực đã được gửi lại thành công!</span>
            </div>
          </div>
        )}

        {/* Help section */}
        <div className={styleVerification["helpSection"]}>
          <p className={styleVerification["helpText"]}>Không nhận được mã?</p>
          <ul className={styleVerification["helpList"]}>
            <li>Kiểm tra hộp thư spam/rác</li>
            <li>Đảm bảo email chính xác</li>
            <li>Chờ 1-2 phút trước khi gửi lại</li>
          </ul>
        </div>

        {/* Footer */}
        <div className={styleVerification["footerSection"]}>
          <p className={styleVerification["footerText"]}>
            Đã có tài khoản?{" "}
            <button
              className={styleVerification["linkButton"]}
              onClick={() => router.push("/auth/login")}
              type="button"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
