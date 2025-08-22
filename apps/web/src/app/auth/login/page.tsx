"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleLogin from "@/app/auth/login/login.module.css";
import axios from "axios";
import { useState } from "react";

const Home = () => {
  const router = useRouter();

    const checkIcons = {
    on: "/image/register/VectorCheckOn.svg",
    off: "/image/register/VectorCheckOff.svg",
    };
    const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: "", password_hash: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBtn = async () => {
    if (!form.email || !form.password_hash) {
    alert("Vui lòng nhập đầy đủ email và mật khẩu");
    return;
  }
  try {
    setLoading(true);

    const res = await axios.post(
      "http://localhost:8080/api/auth/login", // API NestJS
      form,
      { withCredentials: true } // nếu BE dùng cookie/session
    );

    console.log("Login success:", res.data);
    // localStorage.setItem("token", res.data.access_token);
    router.push("/");
  } catch (err: any) {
    if (err.response?.status === 401) {
      // Lỗi đăng nhập sai
      alert(err.response?.data?.message || "Email hoặc mật khẩu không đúng");
    } else {
      // Các lỗi khác mới log ra console
      console.error(err);
      alert("Có lỗi xảy ra, vui lòng thử lại");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className={styleLogin["container"]}>
      <div className={styleLogin["card"]}>
        <div>
          <p className={styleLogin["title"]}>Đăng nhập</p>
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type="text"
            placeholder="Email hoặc số điện thoại"
            className={styleLogin["input"]}
            value={form.email}
            name="email"
            onChange={handleChange}
          />
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            className={styleLogin["input_password"]}
            value={form.password_hash}
            name="password_hash"
            onChange={handleChange}
          />
          <img
            src={showPassword ? "/image/login/mdi_eye_on.svg" : "/image/login/mdi_eye-off.svg"}
            alt="Toggle visibility"
             className={showPassword ? styleLogin['eyeIcon2'] : styleLogin['eyeIcon1']}
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>

        <div style={{ alignSelf: "flex-start", marginLeft: "50px" }}>
          <p
            style={{
              fontSize: "18px",
              color: "#757575",
              fontWeight: "bold",
            }}
          >
            Quên mật khẩu
          </p>
        </div>

        <div style={{ width: "100%", display: "flex", justifyContent: "center" ,alignItems:"center"}}>
          <button className={styleLogin["btnLogin"]} onClick={()=> handleBtn()} disabled={loading}>
            <p style={{ fontSize: "28px", fontWeight: "bold", marginTop:10}}>Đăng nhập</p>
          </button>
        </div>

        <div className={styleLogin["cardline"]}>
          <div className={styleLogin["line"]}></div>
          <span className={styleLogin["linetext"]}>Hoặc đăng nhập bằng</span>
          <div className={styleLogin["line"]}></div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className={styleLogin["btnIcon"]}>
            <img
              src="/image/login/IconGoogle.png"
              alt="Google"
              className={styleLogin["imgIcon"]}
            />
          </button>
          <button className={styleLogin["btnIcon"]}>
            <img
              src="/image/login/IconFacebook.png"
              alt="Facebook"
              className={styleLogin["imgIcon"]}
            />
          </button>
        </div>

        <div style={{ display: "flex" }}>
          <p style={{ fontWeight: "bold", fontSize: 18 }}>
            Chưa có tài khoản ?{" "}
          </p>
          <Link
            href="/auth/register"
            style={{ fontWeight: "bold", fontSize: 18, color: "#3B82F6" }}
          >
            {" "}
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;






