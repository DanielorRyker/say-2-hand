"use client";
import { useRouter } from "next/navigation";
<<<<<<< HEAD

import styleLogin from "@/styles/pages/auth/login.module.scss";
import styleVerification from "@/styles/pages/auth/verification.module.scss";
import axios from "axios";
import { useState } from "react";
=======
import Link from "next/link";
import styleLogin from "@/app/auth/login/login.module.css";
import styleVerification from "@/app/auth/verification/verification.module.css";
import axios from "axios";
import { useEffect, useState } from "react";
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

const Home = () => {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password_hash: "" });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

<<<<<<< HEAD
  const handleBtnLogin = () => {
    router.push("/auth/login");
  };

  // bấm nút xác nhận
  const handleBtn = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/users/exist/${form.email}`
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
=======
  const handleBtnLogin =()=>{
    router.push("/auth/login");
  }


// bấm nút xác nhận
  const handleBtn = async () => {
  try {
    const res = await axios.get(
      `http://localhost:8080/api/users/exist/${form.email}`
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




>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

  return (
    <div className={styleLogin["container"]}>
      <div className={styleVerification["card"]}>
        <div>
          <p className={styleLogin["title"]}>Quên mật khẩu ?</p>
        </div>

        <div className={styleLogin["gradientBorder"]}>
<<<<<<< HEAD
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
=======
            <input
              type="text"
              placeholder="Nhập email đã quên mật khẩu"
              className={styleLogin["input"]}
              value={form.email}
              name="email"
              onChange={handleChange}
          
            />
          </div>

         
          <div style={{ width: "100%", display: "flex", justifyContent: "center" ,alignItems:"center"}} onClick={()=> handleBtn()}>
            <button className={styleLogin["btnLogin"]} >
              <p style={{ fontSize: "28px", fontWeight: "bold", marginTop:10}}>Xác nhận</p>
            </button>
          </div>

          <div className={styleLogin["gradientBorder"]} style={{ width: "100%", display: "flex", justifyContent: "center" ,alignItems:"center"}}>
          <button className={styleLogin["btnLogin"] } style={{background:'#E5E5E5'}} onClick={()=> handleBtnLogin()}>
            <p style={{ fontSize: "28px", fontWeight: "bold", marginTop:10}}>Quay lại đăng nhập</p>
          </button>
        </div>
        
        </div>

 
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
    </div>
  );
};

export default Home;
<<<<<<< HEAD
=======






>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
