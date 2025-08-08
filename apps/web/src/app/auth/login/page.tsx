"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleLogin from "@/styles/login.module.css";

const Home = () => {
  const router = useRouter();

  const handleBtn = () => {
    router.push("/");
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
          />
        </div>

        <div className={styleLogin["gradientBorder"]}>
          <input
            type="password"
            placeholder="Mật khẩu"
            className={styleLogin["input_password"]}
          />
          <img
            src="/image/login/mdi_eye-off.png"
            alt="Toggle visibility"
            className={styleLogin["eyeIcon"]}
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

        <div>
          <button className={styleLogin["btnLogin"]}>
            <p style={{ fontSize: "28px", fontWeight: "bold" }}>Đăng nhập</p>
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





//Cái bash này để ông nhìn nhánh cho dễ du / ông mở lên sau, mở lại tui xem với tui ch kịp nhìn
//ông thấy hong
// ok
// Giờ tui commit thử cái đoạn này 
// Ủa
// Ông mới clone về luôn hả / đr tui clone code lại luôn sợ cái fodler củ nó lõiok
