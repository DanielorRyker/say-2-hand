"use client";

import React, { useState } from "react";
import styles from "./CreatePost.module.scss";
import {
  ProgressBar,
  ImageUploader,
  BasicInfoForm,
  CategoryForm,
  FloatingMessage,
} from "./components";

type PostFormData = {
  title: string;
  description: string;
  condition: "used" | "new";
  transaction_type: "sell" | "exchange" | "donate";
  price: number | null;
  category_id: string;
  location: { province: string; district: string; street: string };
  custom_fields: Record<string, any>;
};

export default function Page() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    description: "",
    condition: "used",
    transaction_type: "sell",
    price: null,
    category_id: "",
    location: { province: "", district: "", street: "" },
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

  function handleSubmit() {
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
                className={styles.btnPrimary}
                onClick={() => {
                  if (images.length === 0)
                    return showMessage("Vui lòng tải lên ít nhất 1 ảnh.");
                  nextStep();
                }}
              >
                <p>Tiếp tục</p>
              </button>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <BasicInfoForm
            formData={formData}
            setFormData={setFormData}
            onPrev={prevStep}
            onNext={nextStep}
            showMessage={showMessage}
          />
        )}

        {currentStep === 3 && (
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
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
