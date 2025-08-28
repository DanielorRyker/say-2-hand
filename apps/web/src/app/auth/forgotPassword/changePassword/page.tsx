"use client";
import { useRouter } from "next/navigation";
import styleLogin from "@/styles/pages/auth/login.module.scss";
import styleVerification from "@/styles/pages/auth/verification.module.scss";
import axios from "axios";
import { useEffect, useState } from "react";
import styleRegister from "@/styles/pages/auth/register.module.scss";
import stylechangePassword from "@/styles/pages/auth/changePassword.module.scss";
import Image from "next/image";

const Home = () => {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [rePassword_hash, setRePassword_hash] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //Lấy mail
  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      setForm((prev) => ({ ...prev, email }));
    }
  }, []);
  // show password
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  //icon check
  const checkIcons = {
    on: "/image/register/VectorCheckOn.svg",
    off: "/image/register/VectorCheckOff.svg",
  };

  // validate
  const isValidLength = form.password.length >= 8 && form.password.length <= 32;
  const hasNumber = /\d/.test(form.password);
  const hasUpperCase = /[A-Z]/.test(form.password);
  const hasLowerCase = /[a-z]/.test(form.password);
  const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  //Bấm xác nhận

  const handleBtn = async () => {
    if (!form.password || !form.otp || !rePassword_hash) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (form.password != rePassword_hash) {
      alert("Mật khẩu nhập lại không khớp !");
      return;
    }
    if (!isValidLength || !hasNumber || !hasUpperCase || !hasLowerCase) {
      alert("Mật khẩu không đúng định dạng !");
      return;
    }
    if (!validateEmail) {
      alert("Email không hợp lệ!");
      return;
    }
    try {
      await axios.post(
        "http://localhost:8080/api/auth/verifyResetPassword", // API NestJS
        form,
        { withCredentials: true } // nếu BE dùng cookie/session
      );
      alert("Đặt lại mật khẩu thành công");
      router.push("/auth/login");
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Lỗi đăng nhập sai
        alert("Sai OTP");
      } else if (err.response?.status === 400) {
        // Lỗi đăng nhập sai
        alert(err.response?.data?.message);
      } else {
        // Các lỗi khác mới log ra console
        console.error(err);
        alert("Có lỗi xảy ra, vui lòng thử lại");
      }
    }
  };

  const handleBtnResend = async () => {
    await axios.get(`http://localhost:8080/api/auth/mailResetPassword`, {
      params: { email: form.email },
    });

    alert("Mã đã được gửi lại tới email: " + form.email);
  };

  return (
    <div className={styleLogin["container"]}>
      <div className={styleVerification["card"]}>
        <div>
          <p className={styleLogin["title"]}>Đổi lại mật khẩu</p>
          <p>Mã xác nhận đã được gửi đến {form.email}</p>
        </div>

        {/* input mật khẩu và nhập lại mật khẩu */}
        <div className={styleLogin["gradientBorder"]}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            className={styleLogin["input_password"]}
            value={form.password}
            name="password"
            onChange={handleChange}
          />
          <Image
            src={
              showPassword
                ? "/image/login/mdi_eye_on.svg"
                : "/image/login/mdi_eye-off.svg"
            }
            alt="Toggle visibility"
            className={
              (showPassword ? styleLogin["eyeIcon2"] : styleLogin["eyeIcon1"]) +
              " " +
              stylechangePassword["pointer"]
            }
            width={24}
            height={24}
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type={showRePassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            className={styleLogin["input_password"]}
            value={rePassword_hash}
            name="rePassword_hash"
            onChange={(e) => setRePassword_hash(e.target.value)}
          />
          <Image
            src={
              showRePassword
                ? "/image/login/mdi_eye_on.svg"
                : "/image/login/mdi_eye-off.svg"
            }
            alt="Toggle visibility"
            className={
              (showRePassword
                ? styleLogin["eyeIcon2"]
                : styleLogin["eyeIcon1"]) +
              " " +
              stylechangePassword["pointer"]
            }
            width={24}
            height={24}
            onClick={() => setShowRePassword(!showRePassword)}
          />
        </div>

        {/* variry password */}
        <div className={styleRegister["gridContainer"]}>
          <div className={styleRegister["frame1"]}>
            <Image
              src={isValidLength ? checkIcons.on : checkIcons.off}
              alt="check"
              className={styleRegister["checkIcon"]}
              width={20}
              height={20}
            />
            <p>Giới hạn từ 8-32 ký tự</p>
          </div>
          <div className={styleRegister["frame1"]}>
            <Image
              src={hasNumber ? checkIcons.on : checkIcons.off}
              alt="check"
              className={styleRegister["checkIcon"]}
              width={20}
              height={20}
            />
            <p>Tối thiểu 01 chữ số</p>
          </div>
          <div className={styleRegister["frame1"]}>
            <Image
              src={hasUpperCase ? checkIcons.on : checkIcons.off}
              alt="check"
              className={styleRegister["checkIcon"]}
              width={20}
              height={20}
            />
            <p>Tối thiểu 01 ký tự IN HOA</p>
          </div>
          <div className={styleRegister["frame1"]}>
            <Image
              src={hasLowerCase ? checkIcons.on : checkIcons.off}
              alt="check"
              className={styleRegister["checkIcon"]}
              width={20}
              height={20}
            />
            <p>Tối thiểu 01 ký tự in thường</p>
          </div>
        </div>

        {/* Nhập OTP */}
        <div className={stylechangePassword["flexCenterGap50"]}>
          <div className={stylechangePassword["gradientBorder"]}>
            <input
              type="text"
              placeholder="Nhập OTP"
              className={stylechangePassword["input"]}
              value={form.otp}
              name="otp"
              onChange={handleChange}
            />
          </div>

          <div
            className={
              styleVerification["gradientBorder"] +
              " " +
              stylechangePassword["gradientFlexCenter"]
            }
          >
            <button
              className={stylechangePassword["btnReSend"]}
              onClick={() => handleBtnResend()}
            >
              <p className={stylechangePassword["btnResendText"]}>Gửi lại mã</p>
            </button>
          </div>
        </div>

        <div className={stylechangePassword["btnConfirmRow"]}>
          <button
            className={styleLogin["btnLogin"]}
            onClick={() => handleBtn()}
          >
            <p className={stylechangePassword["btnConfirmText"]}>Xác nhận</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
