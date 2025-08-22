"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styleLogin from "@/app/auth/login/login.module.css";
import axios from "axios";
import { useState } from "react";

const Home = () => {
  const router = useRouter();

  

  const [form, setForm] = useState({ email: "", password_hash: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBtn = async () => {
   
};

  return (
    <div className={styleLogin["container"]}>
      <div className={styleLogin["card"]}>
        <div>
          <p className={styleLogin["title"]}>Nhập mã xác nhận</p>
          
        </div>

       
      </div>
    </div>
  );
};

export default Home;






