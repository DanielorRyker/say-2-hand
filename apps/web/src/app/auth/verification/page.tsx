"use client";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import styleLogin from "@/styles/pages/auth/login.module.scss";
import styleVerification from "@/styles/pages/auth/verification.module.scss";
=======
import Link from "next/link";
import styleLogin from "@/app/auth/login/login.module.css";
import styleVerification from "@/app/auth/verification/verification.module.css";
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
import axios from "axios";
import { useEffect, useState } from "react";

const Home = () => {
  const router = useRouter();
  //const email = localStorage.getItem('email');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

<<<<<<< HEAD
  const [form, setForm] = useState({ email: "", otp: "" });
=======
    const [form, setForm] = useState({ email: "", otp: "" });
  
  
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
<<<<<<< HEAD
  useEffect(() => {
=======
   useEffect(() => {
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
    const email = localStorage.getItem("email");
    if (email) {
      setForm((prev) => ({ ...prev, email }));
    }
  }, []);

<<<<<<< HEAD
  //Bấm nút gửi lại mã
  const handleClick = async () => {
    try {
      await axios.get(`http://localhost:8080/api/auth/mail`, {
        params: { email: form.email },
      });
    } catch {}
=======
//Bấm nút gửi lại mã
  const handleClick = async () => {
    try {
      await axios.get(`http://localhost:8080/api/auth/mail`, {
            params: { email: form.email },
            });
    } catch (error) {
      
    }
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
    setLoading(true);
    setSuccess(false);
    setCountdown(0);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setCountdown(10);
    }, 3000); // ẩn sau 3s và hiện success
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const isDisabled = loading || countdown > 0;

<<<<<<< HEAD
  // bấm nút xác nhận

  const handleBtn = async () => {
    if (!form.otp) {
      alert("Vui lòng nhập OTP");
      return;
    }
    try {
      await axios.post(
        "http://localhost:8080/api/auth/verify", // API NestJS
        form,
        { withCredentials: true } // nếu BE dùng cookie/session
      );
      alert("Xác thực thành công");
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
=======
// bấm nút xác nhận

  const handleBtn = async () => {
   if (!form.otp ) {
    alert("Vui lòng nhập OTP");
    return;
  }
  try {
    const res = await axios.post(
      "http://localhost:8080/api/auth/verify", // API NestJS
      form,
      { withCredentials: true } // nếu BE dùng cookie/session
    );
    alert("Xác thực thành công");
    router.push("/auth/login");
  } catch (err: any) {
    if (err.response?.status === 404) {
      // Lỗi đăng nhập sai
      alert("Sai OTP");
    }
    else if (err.response?.status === 400) {
      // Lỗi đăng nhập sai
      alert(err.response?.data?.message);
    } else {
      // Các lỗi khác mới log ra console
      console.error(err);
      alert("Có lỗi xảy ra, vui lòng thử lại");
    }
  }
};
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb

  return (
    <div className={styleLogin["container"]}>
      <div className={styleVerification["card"]}>
        <div>
          <p className={styleLogin["title"]}>Nhập mã xác nhận </p>
<<<<<<< HEAD
          <p className={styleVerification["textCenter"]}>
            OTP đã được gửi đến email {form.email}
          </p>
=======
          <p style={{textAlign:"center"}}>OTP đã được gửi đến email {form.email}</p>
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
        </div>
        <div className={styleVerification["gradientBorder"]}>
          <input
            type="text"
            placeholder="Nhập OTP"
            className={styleVerification["input"]}
<<<<<<< HEAD
            value={form.otp}
            name="otp"
            onChange={handleChange}
          />
        </div>

        <div className={styleVerification["flexCenterFull"]}>
          <button className={styleVerification["btnConfirm"]}>
            <p
              className={styleVerification["btnTextLarge"]}
              onClick={handleBtn}
            >
              Xác nhận
            </p>
          </button>
        </div>

        <div
          className={
            styleVerification["gradientBorder"] +
            " " +
            styleVerification["flexCenterFull"]
          }
        >
          <button
            className={styleVerification["btnReSend"]}
            onClick={handleClick}
            disabled={isDisabled}
          >
            <p className={styleVerification["btnTextLarge"]}>Gửi lại mã</p>
          </button>
        </div>

        <>
          {loading && <div className={styleVerification["bar"]}></div>}
          {!loading && success && (
            <span className="text-green-600 font-medium h-10">
              Gửi lại mã thành công {countdown > 0 && `(${countdown})`}
            </span>
          )}
        </>
=======
           value={form.otp}
            name="otp"
            onChange={handleChange}
        
          />
        </div>

        <div style={{ width: "100%", display: "flex", justifyContent: "center" ,alignItems:"center"}}>
          <button  className={styleVerification["btnConfirm"]} >
            <p style={{ fontSize: "28px", fontWeight: "bold", marginTop:10}}  onClick={handleBtn} >Xác nhận</p>
          </button>
        </div>

        <div className={styleVerification["gradientBorder"]} style={{ width: "100%", display: "flex", justifyContent: "center" ,alignItems:"center"}}>
          <button className={styleVerification["btnReSend"] }  onClick={handleClick}  disabled={isDisabled}>
            <p style={{ fontSize: "28px", fontWeight: "bold", marginTop:10}}>Gửi lại mã</p>
          </button>
        </div>


         
          <>
             {loading &&  <div className={styleVerification["bar"]}></div>}
            {!loading && success && (
              <span className="text-green-600 font-medium h-10">Gửi lại mã thành công {countdown > 0 && `(${countdown})`}</span>
            )}
          </>
           

       
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
      </div>
    </div>
  );
};

export default Home;
<<<<<<< HEAD
=======






>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
