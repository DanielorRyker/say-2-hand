"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleLogin from "@/styles/pages/auth/login.module.scss";
import styleRegister from "@/styles/pages/auth/register.module.scss";
import { useState } from "react";
import axios from "axios";
import Image from "next/image";

const Home = () => {
  const [form, setForm] = useState({
    email: "",
    password_hash: "",
    full_name: "",
  });
  const [rePassword_hash, setRePassword_hash] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const [loading, setLoading] = useState(false);

  // show password
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  //icon check
  const checkIcons = {
    on: "/image/register/VectorCheckOn.svg",
    off: "/image/register/VectorCheckOff.svg",
  };

  //chekbox
  const [isChecked, setIsChecked] = useState(false);

  // validate
  const isValidLength =
    form.password_hash.length >= 8 && form.password_hash.length <= 32;
  const hasNumber = /\d/.test(form.password_hash);
  const hasUpperCase = /[A-Z]/.test(form.password_hash);
  const hasLowerCase = /[a-z]/.test(form.password_hash);
  const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const router = useRouter();

  const handleBtn = async () => {
    if (
      !form.email ||
      !form.password_hash ||
      !form.full_name ||
      !rePassword_hash
    ) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (form.password_hash != rePassword_hash) {
      alert("Mật khẩu nhập lại không khớp !");
      return;
    }
    if (!isValidLength || !hasNumber || !hasUpperCase || !hasLowerCase) {
      alert("Mật khẩu không đúng định dạng !");
      return;
    }
    if (!isChecked) {
      alert("Bạn cần đồng ý Điều khoản trước khi đăng ký!");
      return;
    }
    if (!validateEmail) {
      alert("Email không hợp lệ!");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:8080/api/users/", // API NestJS
        form,
        { withCredentials: true }, // nếu BE dùng cookie/session
      );

      await axios.get(`http://localhost:8080/api/auth/mail`, {
        params: { email: form.email },
      });

      alert("Mã xác nhận đã được gửi tới email");
      localStorage.setItem("email", form.email);
      router.push("/auth/verification");
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert("Email đã tồn tại");
      } else {
        console.error(error);
        alert("Có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styleLogin["container"]}>
      <div className={styleRegister["card"]}>
        <div>
          <p className={styleLogin["title"]}>Đăng ký tài khoản</p>
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type="text"
            placeholder="Nhập họ và tên"
            className={styleLogin["input"]}
            value={form.full_name}
            name="full_name"
            onChange={handleChange}
          />
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type="text"
            placeholder="Nhập Email hoặc số điện thoại"
            className={styleLogin["input"]}
            value={form.email}
            name="email"
            onChange={handleChange}
          />
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            className={styleLogin["input_password"]}
            value={form.password_hash}
            name="password_hash"
            onChange={handleChange}
          />
          <Image
            src={
              showPassword
                ? "/image/login/mdi_eye_on.svg"
                : "/image/login/mdi_eye-off.svg"
            }
            alt="Toggle visibility"
            width={24}
            height={24}
            className={
              showPassword ? styleLogin["eyeIcon2"] : styleLogin["eyeIcon1"]
            }
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
            width={24}
            height={24}
            className={
              showRePassword ? styleLogin["eyeIcon2"] : styleLogin["eyeIcon1"]
            }
            onClick={() => setShowRePassword(!showRePassword)}
          />
        </div>

        <div className={styleRegister["gridContainer"]}>
          <div className={styleRegister["frame1"]}>
            <Image
              src={isValidLength ? checkIcons.on : checkIcons.off}
              alt="check"
              width={20}
              height={20}
              className={styleRegister["checkIcon"]}
            />
            <p>Giới hạn từ 8-32 ký tự</p>
          </div>
          <div className={styleRegister["frame1"]}>
            <Image
              src={hasNumber ? checkIcons.on : checkIcons.off}
              alt="check"
              width={20}
              height={20}
              className={styleRegister["checkIcon"]}
            />
            <p>Tối thiểu 01 chữ số</p>
          </div>
          <div className={styleRegister["frame1"]}>
            <Image
              src={hasUpperCase ? checkIcons.on : checkIcons.off}
              alt="check"
              width={20}
              height={20}
              className={styleRegister["checkIcon"]}
            />
            <p>Tối thiểu 01 ký tự IN HOA</p>
          </div>
          <div className={styleRegister["frame1"]}>
            <Image
              src={hasLowerCase ? checkIcons.on : checkIcons.off}
              alt="check"
              width={20}
              height={20}
              className={styleRegister["checkIcon"]}
            />
            <p>Tối thiểu 01 ký tự in thường</p>
          </div>
        </div>

        <div className={styleRegister["flexCheckboxRow"]}>
          <label
            className={styleRegister["custom-checkbox"]}
            title="Đồng ý Điều khoản sử dụng và Chính sách bảo mật của Say2Hand"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              placeholder="Đồng ý Điều khoản"
              title="Đồng ý Điều khoản sử dụng và Chính sách bảo mật của Say2Hand"
            />
            <span className={styleRegister["checkmark"]}></span>
          </label>
          <p>
            Bằng việc Đăng ký, bạn đã đọc và đồng ý với Điều khoản sử dụng và
            Chính sách bảo mật của Say2Hand
          </p>
        </div>

        <div className={styleRegister["centeredButtonRow"]}>
          <button
            className={styleLogin["btnLogin"]}
            onClick={() => handleBtn()}
            disabled={loading}
          >
            <p className={styleRegister["btnTextLarge"]}>Tạo tài khoản</p>
          </button>
        </div>

        <div className={styleLogin["cardline"]}>
          <div className={styleLogin["line"]}></div>
          <span className={styleLogin["linetext"]}>Hoặc đăng nhập bằng</span>
          <div className={styleLogin["line"]}></div>
        </div>

        <div className={styleRegister["flexGap10"]}>
          <button
            className={styleLogin["btnIcon"]}
            title="Đăng nhập với Google"
            aria-label="Đăng nhập với Google"
          >
            <Image
              src="/image/login/IconGoogle.png"
              alt="Google"
              width={32}
              height={32}
              className={styleLogin["imgIcon"]}
            />
          </button>
          <button
            className={styleLogin["btnIcon"]}
            title="Đăng nhập với Facebook"
            aria-label="Đăng nhập với Facebook"
          >
            <Image
              src="/image/login/IconFacebook.png"
              alt="Facebook"
              width={32}
              height={32}
              className={styleLogin["imgIcon"]}
            />
          </button>
        </div>

        <div className={styleRegister["flexRow"]}>
          <p className={styleRegister["bold18"]}>Bạn đã có có tài khoản ? </p>
          <Link
            href="/auth/login"
            style={{ fontWeight: "bold", fontSize: 18, color: "#3B82F6" }}
          >
            {" "}
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
