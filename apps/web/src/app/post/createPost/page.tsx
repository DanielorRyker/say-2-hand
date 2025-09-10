"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./CreatePost.module.scss";

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
      placeholder: "Ví dụ: iPhone 13, Galaxy S21",
    },
    {
      name: "is_new_device",
      label: "Thiết bị mới nguyên hộp?",
      type: "checkbox",
    },
    {
      name: "warranty_info",
      label: "Bảo hành còn hay không?",
      type: "radio",
      options: ["Còn", "Hết", "Không có"],
    },
  ],
  "2": [
    {
      name: "brand",
      label: "Thương hiệu",
      type: "text",
      placeholder: "Ví dụ: Nike, Zara",
    },
    {
      name: "size",
      label: "Kích cỡ",
      type: "select",
      options: ["S", "M", "L", "XL", "Free Size"],
    },
    {
      name: "material",
      label: "Chất liệu",
      type: "text",
      placeholder: "Ví dụ: Cotton, Jeans",
    },
  ],
};

export default function CreatePostPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    condition: "used",
    transaction_type: "sell",
    price: null,
    category_id: "",
    location: { province: "", district: "", street: "" },
    custom_fields: {},
  });

  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const pct = ((currentStep - 1) / (3 - 1)) * 100;
    setProgress(pct);
  }, [currentStep]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(t);
  }, [message]);

  function showMessage(msg: string) {
    setMessage(msg);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    if (images.length + files.length > 10) {
      showMessage("Chỉ được tải lên tối đa 10 ảnh!");
      return;
    }
    const readers: Promise<string>[] = [];
    for (const file of Array.from(files)) {
      readers.push(
        new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (e) => res(String(e.target?.result || ""));
          reader.onerror = rej;
          reader.readAsDataURL(file);
        })
      );
    }
    Promise.all(readers).then((results) =>
      setImages((prev) => [...prev, ...results])
    );
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function onNext1() {
    if (images.length === 0) {
      showMessage("Vui lòng tải lên ít nhất 1 ảnh.");
      return;
    }
    setCurrentStep(2);
  }

  function onNext2(e?: React.FormEvent) {
    e?.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showMessage("Vui lòng nhập đầy đủ tiêu đề và mô tả.");
      return;
    }
    setCurrentStep(3);
  }

  function onPrev(step: number) {
    setCurrentStep(step);
  }

  function onTransactionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setFormData((s: any) => ({ ...s, transaction_type: e.target.value }));
  }

  function onCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setFormData((s: any) => ({ ...s, category_id: id }));
    setDynamicFields(customFieldData[id] || []);
  }

  function onProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const province = e.target.value;
    setFormData((s: any) => ({
      ...s,
      location: { ...s.location, province, district: "" },
    }));
  }

  function onDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const district = e.target.value;
    setFormData((s: any) => ({ ...s, location: { ...s.location, district } }));
  }

  function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!formData.category_id) {
      showMessage("Vui lòng chọn danh mục.");
      return;
    }
    const custom: any = {};
    dynamicFields.forEach((f) => {
      const el = document.getElementById(`dyn-${f.name}`) as
        | HTMLInputElement
        | HTMLSelectElement
        | null;
      if (!el) return;
      if ((el as HTMLInputElement).type === "checkbox")
        custom[f.name] = (el as HTMLInputElement).checked;
      else if ((el as HTMLInputElement).type === "radio") {
        const radios = document.getElementsByName(
          f.name
        ) as NodeListOf<HTMLInputElement>;
        const checked = Array.from(radios).find((r) => r.checked);
        custom[f.name] = checked ? checked.value : null;
      } else custom[f.name] = (el as HTMLInputElement).value;
    });
    const dataToSend = { ...formData, custom_fields: custom };
    console.log("Dữ liệu tin đăng:", JSON.stringify(dataToSend, null, 2));
    showMessage("Đăng tin thành công!");
  }

  return (
    <div className={`${styles.container} p-4 sm:p-8`}>
      <div className={`${styles.card}`}>
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Đăng Tin Mới
        </h1>
        <div className={styles.progressBar + " mb-8"}>
          <div
            className={`${styles.progress} ${progress === 0 ? styles.progress0 : progress === 100 ? styles.progress100 : styles.progress50}`}
          />
        </div>

        <div
          className={`${styles.formSection} ${currentStep === 1 ? styles.formSectionActive : ""}`}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            1. Tải lên hình ảnh
          </h2>
          <div className={`${styles.imagePreviewContainer} mb-4`}>
            <div id="image-previews" className="flex items-center">
              {images.map((src, idx) => (
                <div key={idx} className={styles.imagePreview}>
                  <Image
                    src={src}
                    alt={`preview-${idx}`}
                    fill
                    sizes="150px"
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    className={styles.deleteBtn}
                    onClick={() => removeImage(idx)}
                  >
                    x
                  </div>
                </div>
              ))}
            </div>
            <div
              className={styles.addImageBox + " ml-4"}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="image-upload"
                aria-label="Tải lên ảnh"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="text-center text-gray-500">Thêm ảnh</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mb-8">
            Tối thiểu 1 ảnh, tối đa 10 ảnh. Cuộn ngang để xem tất cả.
          </p>
          <div className="flex justify-end mt-8">
            <button className={styles.btnGradientPrimary} onClick={onNext1}>
              Tiếp tục
            </button>
          </div>
        </div>

        <div
          className={`${styles.formSection} ${currentStep === 2 ? styles.formSectionActive : ""}`}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            2. Thông tin cơ bản
          </h2>
          <form id="basic-info-form" onSubmit={onNext2}>
            <div className="mb-5">
              <label
                htmlFor="title"
                className="block text-gray-700 font-medium mb-2"
              >
                Tiêu đề tin đăng <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((s: any) => ({ ...s, title: e.target.value }))
                }
                required
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="description"
                className="block text-gray-700 font-medium mb-2"
              >
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((s: any) => ({
                    ...s,
                    description: e.target.value,
                  }))
                }
                required
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="condition"
                className="block text-gray-700 font-medium mb-2"
              >
                Tình trạng
              </label>
              <select
                id="condition"
                value={formData.condition}
                onChange={(e) =>
                  setFormData((s: any) => ({ ...s, condition: e.target.value }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="used">Đã qua sử dụng</option>
                <option value="new">Mới</option>
              </select>
            </div>
            <div className="mb-5">
              <label
                htmlFor="transaction_type"
                className="block text-gray-700 font-medium mb-2"
              >
                Hình thức giao dịch
              </label>
              <select
                id="transaction_type"
                aria-label="Hình thức giao dịch"
                value={formData.transaction_type}
                onChange={onTransactionChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="sell">Bán</option>
                <option value="giveaway">Cho</option>
                <option value="exchange">Đổi</option>
              </select>
            </div>
            {formData.transaction_type === "sell" && (
              <div id="price-field" className="mb-5">
                <label
                  htmlFor="price"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Giá tiền (VND)
                </label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  value={formData.price ?? ""}
                  onChange={(e) =>
                    setFormData((s: any) => ({
                      ...s,
                      price: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                className="bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-lg shadow hover:bg-gray-300"
                onClick={() => onPrev(1)}
              >
                Quay lại
              </button>
              <button
                id="next-2"
                type="submit"
                className={styles.btnGradientPrimary}
              >
                Tiếp tục
              </button>
            </div>
          </form>
        </div>

        <div
          className={`${styles.formSection} ${currentStep === 3 ? styles.formSectionActive : ""}`}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            3. Phân loại & Tùy biến
          </h2>
          <form
            id="category-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="mb-5">
              <label htmlFor="category_id" className="block">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                aria-label="Danh mục"
                required
                value={formData.category_id}
                onChange={onCategoryChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="">-- Chọn danh mục --</option>
                <option value="1">Đồ điện tử</option>
                <option value="2">Thời trang</option>
                <option value="3">Sách</option>
              </select>
            </div>

            <div
              id="custom-fields-container"
              className={`border border-dashed border-gray-300 rounded-lg p-5 mt-6 transition-all duration-300 ${dynamicFields.length === 0 ? styles.hidden : ""}`}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-700">
                Tùy chọn
              </h3>
              <div id="dynamic-fields">
                {dynamicFields.map((f: any) => {
                  return (
                    <div className="mb-5" key={f.name}>
                      <label className="block text-gray-700 font-medium mb-2">
                        {f.label}
                      </label>
                      {(f.type === "text" || f.type === "number") && (
                        <input
                          name={f.name}
                          aria-label={f.label}
                          type={f.type}
                          placeholder={f.placeholder}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                      )}
                      {f.type === "select" && (
                        <select
                          name={f.name}
                          aria-label={f.label}
                          className="w-full p-3 border border-gray-300 rounded-lg"
                        >
                          {f.options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                      {f.type === "checkbox" && (
                        <input
                          name={f.name}
                          aria-label={f.label}
                          type="checkbox"
                        />
                      )}
                      {f.type === "radio" &&
                        f.options.map((opt: string) => (
                          <label
                            key={opt}
                            className="inline-flex items-center mr-4"
                          >
                            <input
                              id={`dyn-${f.name}-${opt}`}
                              name={f.name}
                              type="radio"
                              value={opt}
                            />{" "}
                            <span className="ml-2">{opt}</span>
                          </label>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-5 mt-6">
              <label className="block text-gray-700 font-medium mb-2">
                Địa chỉ
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <select
                  id="province-select"
                  aria-label="Tỉnh/Thành"
                  value={formData.location.province}
                  onChange={onProvinceChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Tỉnh/Thành --</option>
                  {Object.keys(addressData).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  id="district-select"
                  aria-label="Quận/Huyện"
                  value={formData.location.district}
                  onChange={onDistrictChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Quận/Huyện --</option>
                  {(addressData[formData.location.province] || []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <input
                id="street-address"
                aria-label="Số nhà, tên đường"
                placeholder="Số nhà, tên đường"
                className="w-full p-3 border border-gray-300 rounded-lg"
                onChange={(e) =>
                  setFormData((s: any) => ({
                    ...s,
                    location: { ...s.location, street: e.target.value },
                  }))
                }
              />
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                className="bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-lg shadow hover:bg-gray-300"
                onClick={() => onPrev(2)}
              >
                Quay lại
              </button>
              <button
                id="submit"
                type="submit"
                className={styles.btnGradientSuccess}
              >
                Đăng tin
              </button>
            </div>
          </form>
        </div>

        <div
          id="message-box"
          className={`${styles.floatingMessage} ${message ? styles.visible : styles.hidden}`}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
