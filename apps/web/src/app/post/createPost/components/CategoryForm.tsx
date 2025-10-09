import React, { useEffect, useState } from "react";
import styles from "./CategoryForm.module.scss";
import stylesBasicForm from "./BasicInfoForm.module.scss";
import dynamic from "next/dynamic";
import axios from "axios";

// import MapPicker động để tránh vấn đề SSR
const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

export default function CategoryForm({
  formData,
  setFormData,
  customFieldData,
  onPrev,
  onSubmit,
  showMessage,
}: any) {
  // trước đây chúng ta có các field riêng tỉnh/quận/đường;
  // giờ hợp nhất thành một input địa chỉ dạng free-text tại
  // `formData.location.address` nên không cần state districts nữa.

  const fields = customFieldData[formData.category_id] || [];

  function setFieldValue(name: string, value: any) {
    setFormData((fd: any) => ({
      ...fd,
      custom_fields: { ...fd.custom_fields, [name]: value },
    }));
  }

  // input tags (lưu trong formData.tags dưới dạng string[])
  const [tagInput, setTagInput] = useState("");
  const MAX_TAGS = 10;

  function addTagFromInput(value?: string) {
    const raw = (value ?? tagInput).trim();
    if (!raw) return;
    // support comma-separated entry
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setFormData((fd: any) => {
      const existing: string[] = Array.isArray(fd.tags) ? fd.tags : [];
      const merged = [...existing];
      const remaining = Math.max(0, MAX_TAGS - merged.length);
      if (remaining === 0) {
        // đã đạt tối đa — input sẽ bị disable ở UI, nên im lặng bỏ qua
        return fd;
      }
      // only add up to remaining slots
      const toAdd = parts
        .filter((p) => !merged.includes(p))
        .slice(0, remaining);
      for (const p of toAdd) merged.push(p);
      // if some parts were dropped due to limit, silently ignore; input will reflect count
      return { ...fd, tags: merged };
    });
    setTagInput("");
  }

  function removeTag(idx: number) {
    setFormData((fd: any) => {
      const existing: string[] = Array.isArray(fd.tags) ? fd.tags : [];
      const next = existing.slice(0, idx).concat(existing.slice(idx + 1));
      return { ...fd, tags: next };
    });
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

      <label>
        <label className={stylesBasicForm.label}>
          {" "}
          Danh mục <span className={styles.required}>*</span>
        </label>

        <select
          aria-label="Danh mục"
          title="Danh mục"
          className={stylesBasicForm.select}
          value={formData.category_id}
          onChange={(e) =>
            setFormData((fd: any) => ({ ...fd, category_id: e.target.value }))
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

      {/* Tags input: allow user to add multiple tags used for search/AI suggestions */}
      <div className={styles.tagsBlock}>
        <label className={stylesBasicForm.label}>Tag (tùy chọn)</label>
        <div className={styles.tagsInputRow}>
          <input
            aria-label="Thêm tag"
            className={stylesBasicForm.input}
            placeholder="Nhập tag và nhấn Enter hoặc dấu phẩy"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTagFromInput();
              }
              if (e.key === "Escape") setTagInput("");
            }}
            disabled={
              Array.isArray(formData.tags) && formData.tags.length >= MAX_TAGS
            }
            title={
              Array.isArray(formData.tags) && formData.tags.length >= MAX_TAGS
                ? "Đã đạt tối đa 10 tag"
                : "Nhập tag và nhấn Enter hoặc dấu phẩy"
            }
          />
        </div>

        <div className={styles.tagList}>
          {(formData.tags || []).map((t: string, i: number) => (
            <span key={t + i} className={styles.tagChip}>
              <span>{t}</span>
              <button
                type="button"
                aria-label={`Xóa tag ${t}`}
                className={styles.tagRemove}
                onClick={() => removeTag(i)}
                title={`Xóa ${t}`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6L6 18"
                    stroke="#0f172a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 6L18 18"
                    stroke="#0f172a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.addressBlock}>
        <label className={stylesBasicForm.label}>
          Địa chỉ <span className={styles.required}>*</span>
        </label>
        <MapPicker
          address={formData.location.address}
          onChangeAddress={(s: string) =>
            setFormData((fd: any) => ({
              ...fd,
              location: { ...fd.location, address: s },
            }))
          }
          onSelectCoords={(lat: number, lon: number) =>
            setFormData((fd: any) => ({
              ...fd,
              location: {
                ...fd.location,
                coords: { lat, lon },
                address: fd.location.address,
              },
            }))
          }
        />
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={stylesBasicForm.btnSecondary}
          onClick={onPrev}
        >
          Quay lại
        </button>
        <button type="submit" className={stylesBasicForm.btnPrimary}>
          Đăng tin
        </button>
      </div>
    </form>
  );
}


