"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleLogin from "@/app/auth/login/login.module.css";
import styleVerification from "@/app/auth/verification/verification.module.css";
import axios from "axios";
import { useEffect, useState } from "react";

const Home = () => {
  const router = useRouter();
  //const email = localStorage.getItem('email');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

    const [form, setForm] = useState({ email: "", otp: "" });
  
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
   useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      setForm((prev) => ({ ...prev, email }));
    }
  }, []);

//Bấm nút gửi lại mã
  const handleClick = async () => {
    try {
      await axios.get(`http://localhost:8080/api/auth/mail`, {
            params: { email: form.email },
            });
    } catch (error) {
      
    }
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

  return (
    <div className={styleLogin["container"]}>
      <div className={styleVerification["card"]}>
        <div>
          <p className={styleLogin["title"]}>Nhập mã xác nhận </p>
          <p style={{textAlign:"center"}}>OTP đã được gửi đến email {form.email}</p>
        </div>
        <div className={styleVerification["gradientBorder"]}>
          <input
            type="text"
            placeholder="Nhập OTP"
            className={styleVerification["input"]}
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
           

       
      </div>
    </div>
  );
};

export default Home;






