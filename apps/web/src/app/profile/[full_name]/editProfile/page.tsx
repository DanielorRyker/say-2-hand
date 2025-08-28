"use client";

import styleLogin from "@/styles/pages/auth/login.module.scss";
import styleRegister from "@/styles/pages/auth/register.module.scss";
import { useState } from "react";
import axios from "axios";
import Image from "next/image";

const Home = () => {
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
    formData.append("file", file); // phải trùng với FileInterceptor('file')

    try {
      const res = await axios.post(
        "http://localhost:8080/api/upload/avatar",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUploadedUrl(res.data.url);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className={styleLogin["container"]}>
      <div className={styleRegister["card"]}>
        <div>
          <h2>Upload Avatar</h2>
          <label
            htmlFor="avatar-upload"
            className={styleRegister["labelAvatarUpload"]}
          >
            Chọn ảnh đại diện:
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styleRegister["inputFileCustom"]}
            title="Chọn ảnh đại diện"
          />
          {preview && <Image src={preview} alt="preview" width={120} />}
          <br />
          <button
            onClick={handleUpload}
            className={styleRegister["btnUploadCustom"]}
          >
            Upload
          </button>

          {uploadedUrl && (
            <div>
              <p>Uploaded Avatar:</p>
              <Image
                src={uploadedUrl}
                alt="uploaded"
                width={120}
                height={120}
                className={styleRegister["imgUploadedCustom"]}
              />
              <p>URL: {uploadedUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
