import React, { useEffect, useState } from "react";
// Removed unused and incorrect import
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
  loading = false,
  aiTags = [],
  aiSuggestedCategory = null,
  onAnalyzeImages,
  aiLoading = false,
  aiError = null,
}: any) {
  // trước đây chúng ta có các field riêng tỉnh/quận/đường;
  // giờ hợp nhất thành một input địa chỉ dạng free-text tại
  // `formData.location.address` nên không cần state districts nữa.

  //lấy dữ liệu Category từ BE
  interface Category {
    _id: string;
    name?: string;
    slug?: string;
    image?: string;
    icon?: string;
    parent_id?: {
      _id: string;
      name?: string;
      icon?: string;
    } | null;
  }
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);

  // Tách danh mục cha và con
  const parentCategories = categoriesData.filter((cat) => !cat.parent_id);
  const childCategories = categoriesData.filter((cat) => cat.parent_id);

  useEffect(() => {
    async function fetchCategories() {
      const res = await axios.get("http://localhost:8080/api/categories/");
      setCategoriesData(res.data); // res.data là danh sách categories
    }
    fetchCategories();
  }, []);

  // Tự động set tags khi AI phân tích xong
  useEffect(() => {
    if (aiTags && aiTags.length > 0 && !aiLoading) {
      setFormData((fd: any) => ({
        ...fd,
        tags: Array.isArray(aiTags) ? [...aiTags] : [],
      }));
    }
  }, [aiTags, aiLoading, setFormData]);

  // Tự động set category khi AI gợi ý
  useEffect(() => {
    if (aiSuggestedCategory && aiSuggestedCategory._id && !aiLoading) {
      setFormData((fd: any) => ({
        ...fd,
        category_id: aiSuggestedCategory._id,
      }));
    }
  }, [aiSuggestedCategory, aiLoading, setFormData]);

  const fields = customFieldData[formData.category_id] || [];

  function setFieldValue(name: string, value: any) {
    setFormData((fd: any) => ({
      ...fd,
      custom_fields: { ...fd.custom_fields, [name]: value },
    }));
  }

  // input tags (lưu trong formData.tags dưới dạng string[])
  const [tagInput, setTagInput] = useState("");
  // aiTags đã nhận qua props
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
        if (!formData.location.address)
          return showMessage("Vui lòng chọn địa chỉ.");
        onSubmit();
      }}
    >
      <h2 className={styles.sectionTitle}>3. Phân loại & Tùy biến</h2>
      {/* Nút gọi AI để phân tích ảnh và lấy tag gợi ý */}
      <button
        type="button"
        className={styles.aiButton}
        onClick={() => {
          console.log("🔘 AI Button clicked!");
          console.log("onAnalyzeImages exists?", typeof onAnalyzeImages);
          // Gọi phân tích AI
          onAnalyzeImages?.();
        }}
        disabled={aiLoading}
        title={
          aiLoading
            ? "Đang phân tích ảnh..."
            : "Phân tích ảnh bằng AI để lấy gợi ý tag"
        }
      >
        <svg
          className={styles.aiIcon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="currentColor"
          />
        </svg>
        <span>
          {aiLoading
            ? "Đang phân tích..."
            : aiTags.length > 0
              ? "Phân tích lại"
              : "Gợi ý từ AI"}
        </span>
      </button>

      {/* Hiển thị gợi ý danh mục từ AI */}
      {aiSuggestedCategory && !aiLoading && (
        <div className={styles.aiSuggestion}>
          <svg
            className={styles.suggestionIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            AI gợi ý danh mục:{" "}
            <strong>
              {aiSuggestedCategory.icon && `${aiSuggestedCategory.icon} `}
              {aiSuggestedCategory.name}
            </strong>
          </span>
        </div>
      )}

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
          {parentCategories.map((parent) => {
            // Lấy các danh mục con của parent này
            const children = childCategories.filter(
              (child) => child.parent_id?._id === parent._id
            );

            return (
              <React.Fragment key={parent._id}>
                {/* Hiển thị danh mục cha với icon nếu có */}
                <option value={parent._id} className={styles.parentOption}>
                  {parent.icon ? `${parent.icon} ` : "📁 "}
                  {parent.name}
                </option>

                {/* Hiển thị các danh mục con với indent */}
                {children.map((child) => (
                  <option
                    key={child._id}
                    value={child._id}
                    className={styles.childOption}
                  >
                    {child.icon ? `  ${child.icon} ` : "  └─ "}
                    {child.name}
                  </option>
                ))}
              </React.Fragment>
            );
          })}
        </select>

        {/* Hiển thị thông tin danh mục đã chọn */}
        {formData.category_id &&
          (() => {
            const selected = categoriesData.find(
              (c) => c._id === formData.category_id
            );
            if (!selected) return null;

            return (
              <div className={styles.selectedCategory}>
                <span className={styles.selectedLabel}>Đã chọn:</span>
                <span className={styles.selectedValue}>
                  {selected.icon && (
                    <span className={styles.selectedIcon}>{selected.icon}</span>
                  )}
                  <span>{selected.name}</span>
                  {selected.parent_id && (
                    <span className={styles.parentInfo}>
                      (thuộc {selected.parent_id.name})
                    </span>
                  )}
                </span>
              </div>
            );
          })()}
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

        {/* Hiển thị lỗi AI nếu có */}
        {aiError && (
          <div className={styles.aiError}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.aiErrorIcon}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM11 13C11 13.5523 10.5523 14 10 14C9.44772 14 9 13.5523 9 13C9 12.4477 9.44772 12 10 12C10.5523 12 11 12.4477 11 13ZM10 5C9.44772 5 9 5.44772 9 6V10C9 10.5523 9.44772 11 10 11C10.5523 11 11 10.5523 11 10V6C11 5.44772 10.5523 5 10 5Z"
                fill="#DC2626"
              />
            </svg>
            <span>{aiError}</span>
          </div>
        )}

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
          onSelectAddressDetails={(details: any) =>
            setFormData((fd: any) => ({
              ...fd,
              location: {
                ...fd.location,
                detail_address: details.detail,
                ward: details.ward,
                province: details.province,
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
        <button
          type="submit"
          className={stylesBasicForm.btnPrimary}
          disabled={loading}
        >
          {loading ? "Đang đăng..." : "Đăng tin"}
        </button>
      </div>
    </form>
  );
}
