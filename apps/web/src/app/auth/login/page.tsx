"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleLogin from "@/styles/pages/auth/login.module.scss";
import axios from "axios";
import { useState } from "react";
import Image from "next/image";

const Home = () => {
  const router = useRouter();

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

       const data = res.data;
       console.log("data", data);

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
    
      //Lấy thông tin user
      const token = localStorage.getItem("access_token");
      console.log('Login Token:',token)
      const userRes = await axios.get(
        `http://localhost:8080/api/users/find/${form.email}`,{
          headers: {
          Authorization: `Bearer ${token}`,
      },
        }
      );
      localStorage.setItem("user", JSON.stringify(userRes.data));

      const userStr = localStorage.getItem("user");
      let user;
      if (userStr) {
        user = JSON.parse(userStr); // chuyển string -> object
        // console.log(user.status); // ✅ lấy được status
      }

      if (user.status == "active") {
        if (user.role == "admin") {
          router.push("/admin/users");
        } else {
          router.push("/");
        }
      } else {
        alert("Tài khoản chưa được kích hoạt");
        localStorage.setItem("email", form.email);
        router.push("/auth/verification");
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        // Lỗi đăng nhập sai
        alert(err.response?.data?.message || "Email hoặc mật khẩu không đúng");
      }
       else if (err.response?.status === 401) {
        // Lỗi đăng nhập sai
        alert(err.response?.data?.message || "Phiên đăng nhập đã kết thúc vui lòng đăng nhập lại !!!");
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

        <div className={styleLogin["forgotLink"]}>
          <Link
            href="/auth/forgotPassword/confirmEmail"
            className={styleLogin["forgotLinkText"]}
          >
            Quên mật khẩu
          </Link>
        </div>

        <div className={styleLogin["centeredButtonRow"]}>
          <button
            className={styleLogin["btnLogin"]}
            onClick={() => handleBtn()}
            disabled={loading}
          >
            <p className={styleLogin["btnTextLarge"]}>Đăng nhập</p>
          </button>
        </div>

        <div className={styleLogin["cardline"]}>
          <div className={styleLogin["line"]}></div>
          <span className={styleLogin["linetext"]}>Hoặc đăng nhập bằng</span>
          <div className={styleLogin["line"]}></div>
        </div>

        <div className={styleLogin["flexGap10"]}>
          <button
            className={styleLogin["btnIcon"]}
            title="Đăng nhập với Google"
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

        <div className={styleLogin["flexRow"]}>
          <p className={styleLogin["bold18"]}>Chưa có tài khoản ? </p>
          <Link href="/auth/register" className={styleLogin["bold18Blue"]}>
            {" "}
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
