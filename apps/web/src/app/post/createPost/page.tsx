"use client";

import React, { useEffect, useState } from "react";
import styles from "./CreatePost.module.scss";
import stylesBasicForm from "./components/BasicInfoForm.module.scss";
import {
  ProgressBar,
  ImageUploader,
  BasicInfoForm,
  CategoryForm,
  FloatingMessage,
} from "./components";
import axios from "axios";


type PostFormData = {
  title: string;
  description: string;
  condition: "used" | "new";
  transaction_type: "sell" | "exchange" | "donate";
  price: number | null;
  category_id: string;
  // một input địa chỉ đơn thay thế cho tỉnh/quận/đường
  location: { address: string };
  custom_fields: Record<string, any>;
};

export default function Page() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  //Lấy User
const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

 

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    description: "",
    condition: "used",
    transaction_type: "sell",
    price: null,
    category_id: "",
    location: { address: "" },
    custom_fields: {},
  });

  const addressData: Record<string, string[]> = {
    "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Đống Đa", "Hai Bà Trưng", "Thanh Xuân"],
    "TP. Hồ Chí Minh": [
      "Quận 1",
      "Quận 2",
      "Quận 3",
      "Quận 4",
      "Quận 5",
      "Quận Gò Vấp",
      "Quận Bình Thạnh",
    ],
    "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn"],
    "Hải Phòng": ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An"],
    "Cần Thơ": ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn"],
  };

  const customFieldData: Record<string, any[]> = {
    "1": [
      {
        name: "brand",
        label: "Hãng sản xuất",
        type: "text",
        placeholder: "Ví dụ: Apple, Samsung",
      },
      {
        name: "model",
        label: "Model",
        type: "text",
        placeholder: "Ví dụ: iPhone 13",
      },
      {
        name: "is_new_device",
        label: "Thiết bị mới nguyên hộp?",
        type: "checkbox",
      },
      {
        name: "warranty_info",
        label: "Bảo hành",
        type: "radio",
        options: ["Còn", "Hết", "Không có"],
      },
    ],
    "2": [
      { name: "brand", label: "Thương hiệu", type: "text" },
      {
        name: "size",
        label: "Kích cỡ",
        type: "select",
        options: ["S", "M", "L", "XL", "Free Size"],
      },
      { name: "material", label: "Chất liệu", type: "text" },
    ],
  };

  function showMessage(msg: string, duration = 3000) {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  }

  function nextStep() {
    setCurrentStep((s) => Math.min(s + 1, 3));
  }
  function prevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

// ✅ Chuyển base64 → File
  function base64ToFile(base64: string, filename: string) {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // ✅ Load ảnh từ localStorage (ở trang khác lưu base64)
  
  useEffect(() => {
  const interval = setInterval(() => {
    const savedImages = localStorage.getItem("uploadedImages");
    if (savedImages) {
      try {
        const parsed = JSON.parse(savedImages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const files = parsed.map((base64: string, i: number) =>
            base64ToFile(base64, `image_${i + 1}.png`)
          );
          setSelectedFiles(files);
          clearInterval(interval); // ✅ Dừng khi đã có ảnh
        }
      } catch (err) {
        console.error("Error parsing saved images:", err);
      }
    }
  }, 200);

  return () => clearInterval(interval);
}, []);


  // Upload ảnh lên server (NestJS endpoint /upload/imgs)
  const uploadImages = async (files: File[], title: string): Promise<string[]> => {
    if (!files || files.length === 0)
    {
      console.warn("No files to upload.");
      return [];
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("bucket", "posts/"+currentUser._id+"/"+title); 

    try {
      const res = await axios.post(
        "http://localhost:8080/api/upload/imgs",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Upload response:", res.data);
      return res.data.filenames; // giả sử BE trả về { filenames: [...] }
    } catch (err: any) {
      console.error("Upload error:", err);
      return [];
    }
  };

  //Bấm nút đăng tin

  async function handleSubmit() {
    if (images.length === 0) {
      showMessage("Vui lòng tải lên ít nhất 1 ảnh.");
      setCurrentStep(1);
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      showMessage("Vui lòng nhập tiêu đề và mô tả.");
      setCurrentStep(2);
      return;
    }
    if (!formData.category_id) {
      showMessage("Vui lòng chọn danh mục.");
      setCurrentStep(3);
      return;
    }

    console.log("Dữ liệu tin đăng:", { images, formData });

    //Upload ảnh
     await uploadImages(selectedFiles,formData.title);
    showMessage("Đăng tin thành công!");
  }

  

  



  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Đăng Tin Mới</h1>
      <ProgressBar step={currentStep} />

      <div className={styles.section}>
        {currentStep === 1 && (
          <section>
            <h2 className={styles.sectionTitle}>1. Tải lên hình ảnh</h2>
            <ImageUploader
              images={images}
              setImages={setImages}
              showMessage={showMessage}
            />
            <div className={styles.actionsRow}>
              <button
                className={stylesBasicForm.btnPrimary}
                onClick={() => {
                  if (images.length === 0)
                    return showMessage("Vui lòng tải lên ít nhất 1 ảnh.");
                  nextStep();
                }}
              >
                Tiếp tục
              </button>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <BasicInfoForm
            formData={formData}
            setFormData={
              setFormData as unknown as React.Dispatch<
                React.SetStateAction<any>
              >
            }
            onPrev={prevStep}
            onNext={nextStep}
            showMessage={showMessage}
          />
        )}

        {currentStep === 3 && (
          <CategoryForm
            formData={formData}
            setFormData={
              setFormData as unknown as React.Dispatch<
                React.SetStateAction<any>
              >
            }
            addressData={addressData}
            customFieldData={customFieldData}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            showMessage={showMessage}
          />
        )}
      </div>

      <FloatingMessage message={message} />
    </div>
  );
}
