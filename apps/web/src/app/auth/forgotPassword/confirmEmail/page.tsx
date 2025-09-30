"use client";
import { useRouter } from "next/navigation";

import styleLogin from "@/styles/pages/auth/login.module.scss";
import styleVerification from "@/styles/pages/auth/verification.module.scss";
import axios from "axios";
import { useState } from "react";

const Home = () => {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password_hash: "" });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBtnLogin = () => {
    router.push("/auth/login");
  };

  // bấm nút xác nhận
  const handleBtn = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/users/exist/${form.email}`,
      );

      if (res.data === true) {
        localStorage.setItem("email", form.email);

        await axios.get(`http://localhost:8080/api/auth/mailResetPassword`, {
          params: { email: form.email },
        });

        alert("Mã OTP đã được gửi đến mail của bạn");
        router.push("/auth/forgotPassword/changePassword");
      } else {
        alert("Email không tồn tại");
      }
    } catch (error) {
      alert("Có lỗi xảy ra vui lòng thử lại !");
      console.error(error);
    }
  };

  return (
    <div className={styleLogin["container"]}>
      <div className={styleVerification["card"]}>
        <div>
          <p className={styleLogin["title"]}>Quên mật khẩu ?</p>
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type="text"
            placeholder="Nhập email đã quên mật khẩu"
            className={styleLogin["input"]}
            value={form.email}
            name="email"
            onChange={handleChange}
          />
        </div>

        <div
          className={styleLogin["centeredButtonRow"]}
          onClick={() => handleBtn()}
        >
          <button className={styleLogin["btnLogin"]}>
            <p className={styleLogin["btnTextLarge"]}>Xác nhận</p>
          </button>
        </div>

        <div
          className={
            styleLogin["gradientBorder"] + " " + styleLogin["centeredButtonRow"]
          }
        >
          <button
            className={styleLogin["btnLogin"] + " " + styleLogin["btnGray"]}
            onClick={() => handleBtnLogin()}
          >
            <p className={styleLogin["btnTextLarge"]}>Quay lại đăng nhập</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
