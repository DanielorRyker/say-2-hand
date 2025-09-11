"use client";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import axios from "axios";
import styleUser from "@/styles/pages/profile/user.module.css";

const Home = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    _id: "",
    email: "",
    full_name: "",
    phone_number: "",
    address: "",
    description: "",
    avatar: "",
  });

  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number: string;
    address: string;
    description: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // cập nhật email vào form luôn
      setForm((prev) => ({
        ...prev,
        _id: parsedUser._id || "",
        email: parsedUser.email || "",
        full_name: parsedUser.full_name || "",
        phone_number: parsedUser.phone_number || "",
        address: parsedUser.address || "",
        description: parsedUser.description || "",
        avatar: parsedUser.avatar || "",
      }));
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //Xử lý ảnh
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Vui lòng chọn file!");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", form._id); // thêm userId

    try {
      const res = await axios.post(
        "http://localhost:8080/api/upload/avatar",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const imageUrl = res.data.url;
      setUploadedUrl(imageUrl);

      const avatar_url = imageUrl.split("say2hand/");

      // ✅ Gán ảnh mới vào form
      setForm((prevForm) => ({
        ...prevForm,
        avatar: avatar_url[1],
      }));
      alert("Upload thành công!");
      const userRes = await axios.get(
        `http://localhost:8080/api/users/find/${form.email}`
      );
      localStorage.setItem("user", JSON.stringify(userRes.data));
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleBack = () => {
    router.push(`/profile/${form.full_name}`);
  };

  const handleFormSubmit = async () => {
    try {
      const res = await axios.patch(`http://localhost:8080/api/users/`, form, {
        withCredentials: true,
      });

      const userRes = await axios.get(
        `http://localhost:8080/api/users/find/${form.email}`
      );
      localStorage.setItem("user", JSON.stringify(userRes.data));
      alert("Cập nhật thành công!");
      router.push(`/profile/${form.full_name}`);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className={styleUser["container"]}>
      <div className={styleUser["gradientBorder"]}>
        <div className={styleUser["card"]} style={{ paddingTop: 50 }}>
          {preview ? (
            <div>
              <input
                type="file"
                accept="image/*"
                id="upload-avatar"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <label htmlFor="upload-avatar">
                <img
                  src={preview}
                  alt="preview"
                  className={styleUser["avatarImgNew"]}
                />
              </label>
            </div>
          ) : (
            <div className={styleUser["gradientBorderAvatar"]}>
              <div className={styleUser["cardChangeAvatar"]}>
                <input
                  type="file"
                  accept="image/*"
                  id="upload-avatar"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <label htmlFor="upload-avatar">
                  <img
                    src="/image/profile/camera.svg"
                    alt="Upload avatar"
                    className={styleUser["changeAvatarImg"]}
                  />
                </label>
              </div>
            </div>
          )}

          <div>
            <button
              className={styleUser["btnChangeAvatar"]}
              onClick={handleUpload}
            >
              Đổi ảnh đại diện
            </button>
          </div>

          <div style={{ padding: 50 }}>
            <div className={styleUser["gradientBorderInfo"]}>
              <div className={styleUser["changeInfoCar"]}>
                <label className={styleUser["infoLable"]}>
                  Tên tài khoản :
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên tài khoản"
                  className={styleUser["inputInfo"]}
                  value={form.full_name}
                  name="full_name"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styleUser["gradientBorderInfo"]}>
              <div className={styleUser["changeInfoCar"]}>
                <label className={styleUser["infoLable"]}>
                  Số điện thoại :
                </label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại"
                  className={styleUser["inputInfo"]}
                  value={form.phone_number}
                  name="phone_number"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styleUser["gradientBorderInfo"]}>
              <div className={styleUser["changeInfoCar"]}>
                <label className={styleUser["infoLable"]}>Địa chỉ :</label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ"
                  className={styleUser["inputInfo"]}
                  value={form.address}
                  name="address"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styleUser["gradientBorderInfo"]}>
              <div className={styleUser["textAreaDescriptionCar"]}>
                <label className={styleUser["infoLable"]}>Giới thiệu :</label>
                <textarea
                  placeholder="Nhập giới thiệu về bản thân"
                  className={styleUser["textAreaDescription"]}
                  value={form.description}
                  name="description"
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              className={styleUser["btnConfirm"]}
              onClick={handleFormSubmit}
            >
              Xác nhận
            </button>
            <div
              className={styleUser["gradientBorderInfo"]}
              style={{ marginTop: 20 }}
            >
              <button className={styleUser["btnBack"]} onClick={handleBack}>
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
