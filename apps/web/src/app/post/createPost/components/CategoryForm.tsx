import React, { useEffect, useState } from "react";
import styles from "./CategoryForm.module.scss";

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

type Props = {
  formData: PostFormData;
  setFormData: React.Dispatch<React.SetStateAction<PostFormData>>;
  addressData: Record<string, string[]>;
  customFieldData: Record<string, any[]>;
  onPrev: () => void;
  onSubmit: () => void;
  showMessage?: (msg: string) => void;
};

export default function CategoryForm({
  formData,
  setFormData,
  addressData,
  customFieldData,
  onPrev,
  onSubmit,
  showMessage,
}: Props) {
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    if (formData.location.province && addressData[formData.location.province]) {
      setDistricts(addressData[formData.location.province]);
    } else setDistricts([]);
  }, [formData.location.province, addressData]);

  const fields = customFieldData[formData.category_id] || [];

  function setFieldValue(name: string, value: any) {
    setFormData((fd) => ({
      ...fd,
      custom_fields: { ...fd.custom_fields, [name]: value },
    }));
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!formData.category_id)
          return showMessage("Vui lòng chọn danh mục.");
        onSubmit();
      }}
    >
      <h2 className={styles.sectionTitle}>3. Phân loại & Tùy biến</h2>

      <label className={styles.label}>
        Danh mục <span className={styles.required}>*</span>
        <select
          aria-label="Danh mục"
          title="Danh mục"
          className={styles.select}
          value={formData.category_id}
          onChange={(e) =>
            setFormData((fd) => ({ ...fd, category_id: e.target.value }))
          }
          required
        >
          <option value="">-- Chọn danh mục --</option>
          <option value="1">Đồ điện tử</option>
          <option value="2">Thời trang</option>
          <option value="3">Sách</option>
          <option value="4">Đồ gia dụng</option>
          <option value="5">Đồ trẻ em</option>
        </select>
      </label>

      {fields.length > 0 && (
        <div className={styles.customFields}>
          <h3 className={styles.subHeading}>Tùy chọn danh mục</h3>
          {fields.map((f: any) => (
            <div key={f.name} className={styles.fieldRow}>
              <label className={styles.labelSmall}>{f.label}</label>
              {f.type === "text" || f.type === "number" ? (
                <input
                  aria-label={f.label}
                  title={f.label}
                  className={styles.input}
                  type={f.type}
                  placeholder={f.placeholder || ""}
                  value={formData.custom_fields[f.name] ?? ""}
                  onChange={(e) => setFieldValue(f.name, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select
                  aria-label={f.label}
                  title={f.label}
                  className={styles.select}
                  value={formData.custom_fields[f.name] ?? ""}
                  onChange={(e) => setFieldValue(f.name, e.target.value)}
                >
                  <option value="">--</option>
                  {f.options?.map((o: any) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  aria-label={f.label}
                  title={f.label}
                  type="checkbox"
                  checked={!!formData.custom_fields[f.name]}
                  onChange={(e) => setFieldValue(f.name, e.target.checked)}
                />
              ) : f.type === "radio" ? (
                <div>
                  {f.options?.map((o: any) => (
                    <label key={o} className={styles.radioLabel}>
                      <input
                        aria-label={f.label}
                        title={f.label}
                        type="radio"
                        name={f.name}
                        value={o}
                        checked={formData.custom_fields[f.name] === o}
                        onChange={(e) => setFieldValue(f.name, e.target.value)}
                      />{" "}
                      {o}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className={styles.addressBlock}>
        <label className={styles.label}>
          Tỉnh/Thành
          <select
            className={styles.select}
            value={formData.location.province}
            onChange={(e) =>
              setFormData((fd) => ({
                ...fd,
                location: {
                  ...fd.location,
                  province: e.target.value,
                  district: "",
                },
              }))
            }
          >
            <option value="">-- Tỉnh/Thành --</option>
            {Object.keys(addressData).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Quận/Huyện
          <select
            className={styles.select}
            value={formData.location.district}
            onChange={(e) =>
              setFormData((fd) => ({
                ...fd,
                location: { ...fd.location, district: e.target.value },
              }))
            }
            disabled={!districts.length}
          >
            <option value="">-- Quận/Huyện --</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          Số nhà, tên đường
          <input
            className={styles.input}
            id="street-address"
            value={formData.location.street}
            onChange={(e) =>
              setFormData((fd) => ({
                ...fd,
                location: { ...fd.location, street: e.target.value },
              }))
            }
            placeholder="Số nhà, tên đường"
          />
        </label>
      </div>

      <div className={styles.actionsRow}>
        <button type="button" className={styles.btnSecondary} onClick={onPrev}>
          Quay lại
        </button>
        <button type="submit" className={styles.btnSuccess}>
          Đăng tin
        </button>
      </div>
    </form>
  );
}
