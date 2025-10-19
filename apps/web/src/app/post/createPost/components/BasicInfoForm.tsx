import React, { useState, useRef, useEffect } from "react";
import styles from "./BasicInfoForm.module.scss";
import stylesCategoryForm from "./CategoryForm.module.scss";

type FormData = {
  title: string;
  description: string;
  condition:
    | "used"
    | "new"
    | "like new"
    | "minor flaw"
    | "for repair"
    | "for parts";
  transaction_type: "sell" | "exchange" | "give away";

  price?: number | null;
};

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onPrev: () => void;
  onNext: () => void;
  showMessage?: (msg: string) => void;
};

export default function BasicInfoForm({
  formData,
  setFormData,
  onPrev,
  onNext,
  showMessage,
}: Props) {
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
  }>({});
  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  // giá hiển thị cục bộ để hiển thị dấu phân hàng nghìn trong khi
  // vẫn giữ giá trị số trong formData.price
  const [priceInput, setPriceInput] = useState<string>(
    formData.price != null ? Number(formData.price).toLocaleString("vi-VN") : ""
  );

  const PRICE_STEP = 1000;
  const PRICE_MIN = 0;
  // giá tối đa cho phép: 1.000.000.000.000 VND (một nghìn tỷ)
  const PRICE_MAX = 1_000_000_000_000;
  const BASE_MAX = Math.floor(PRICE_MAX / PRICE_STEP);
  const baseRef = useRef<number | null>(
    (() => {
      if (formData.price == null) return null;
      const parsed = Number(formData.price);
      return Number.isFinite(parsed) ? Math.round(parsed / PRICE_STEP) : null;
    })()
  );
  const prevRawRef = useRef<string>(
    baseRef.current != null ? String(baseRef.current) : ""
  );

  const [priceRaw, setPriceRaw] = useState<string>(
    baseRef.current != null ? String(baseRef.current) : ""
  );
  // không cần editingPrice hiện tại; caret được xử lý trực tiếp
  // priceBase không lưu riêng; baseRef và priceRaw theo dõi giá trị
  const priceElRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // đồng bộ base refs khi formData.price ở component cha thay đổi từ bên ngoài
    const parsed = formData.price != null ? Number(formData.price) : NaN;
    const base = Number.isFinite(parsed)
      ? Math.round(parsed / PRICE_STEP)
      : null;
    baseRef.current = base;
    prevRawRef.current = base != null ? String(base) : "";
    setPriceInput(Number.isFinite(parsed) ? formatVnd(parsed) : "");
    setPriceRaw(base != null ? String(base) : "");
  }, [formData.price]);

  function setBaseFromRaw(raw: string) {
    // loại bỏ số 0 dẫn đầu
    const cleaned = raw.replace(/^0+/, "");
    const finalRaw = cleaned === "" ? "" : cleaned;
    setPriceRaw(finalRaw);
    prevRawRef.current = finalRaw;
    let base = finalRaw ? Number(finalRaw) : null;
    if (base != null) {
      if (!Number.isFinite(base)) base = null;
      else if (base > BASE_MAX) base = BASE_MAX;
      else if (base < 0) base = 0;
    }
    baseRef.current = base;
    const value = base != null ? base * PRICE_STEP : null;
    setFormData((fd) => ({ ...fd, price: value }));
    // khi edit, hiển thị base đã format + '.000' để người dùng luôn thấy hậu tố
    const formattedBase = base != null ? base.toLocaleString("vi-VN") : "";
    const display = formattedBase ? `${formattedBase}.000` : "";
    setPriceInput(display);
    // khôi phục caret ngay trước hậu tố '.000' (ở tick tiếp theo)
    setTimeout(() => {
      const el = priceElRef.current;
      if (!el) return;
      if (!display) {
        el.setSelectionRange(0, 0);
        return;
      }
      const pos = Math.max(0, display.length - 4);
      el.setSelectionRange(pos, pos);
    }, 0);
  }

  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key;
    // cho phép phím modifier và điều hướng
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (
      key === "Tab" ||
      key === "Enter" ||
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Home" ||
      key === "End"
    ) {
      return;
    }

    // Xử lý phím mũi tên lên/xuống riêng (bước tăng/giảm)
    if (key === "ArrowUp" || key === "ArrowDown") {
      e.preventDefault();
      const curParsed = formData.price != null ? Number(formData.price) : NaN;
      const cur = Number.isFinite(curParsed) ? curParsed : 0;
      const delta = key === "ArrowUp" ? PRICE_STEP : -PRICE_STEP;
      let next = cur + delta;
      if (next < PRICE_MIN) next = PRICE_MIN;
      let base = Math.round(next / PRICE_STEP);
      if (!Number.isFinite(base)) base = null as any;
      if (base != null && base > BASE_MAX) base = BASE_MAX;
      baseRef.current = base;
      setFormData((fd) => ({ ...fd, price: next }));
      // show formatted base + suffix while editing
      const baseForFormat = Number.isFinite(next)
        ? Math.round(next / PRICE_STEP)
        : null;
      const formattedBaseNext =
        baseForFormat != null ? baseForFormat.toLocaleString("vi-VN") : "";
      setPriceInput(formattedBaseNext ? `${formattedBaseNext}.000` : "");
      setPriceRaw(base != null ? String(base) : "");
      return;
    }

    // Nhập chữ số
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      const el = priceElRef.current;
      if (!el) return;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? start;
      const formatted = priceInput || "";
      // count digits before start/end to map to raw indices
      const digitsBeforeStart = Math.min(
        (formatted.slice(0, start).match(/\d/g) || []).length,
        (priceRaw || "").length
      );
      const digitsBeforeEnd = Math.min(
        (formatted.slice(0, end).match(/\d/g) || []).length,
        (priceRaw || "").length
      );
      const cur = priceRaw || "";
      let newRaw =
        cur.slice(0, digitsBeforeStart) + key + cur.slice(digitsBeforeEnd);
      // if newRaw exceeds BASE_MAX, clamp
      if (Number(newRaw) > BASE_MAX) newRaw = String(BASE_MAX);
      setBaseFromRaw(newRaw);
      return;
    }

    // Backspace: xoá các chữ số đã chọn hoặc chữ số ngay trước caret
    if (key === "Backspace") {
      e.preventDefault();
      const el = priceElRef.current;
      if (!el) return;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? start;
      const formatted = priceInput || "";
      const digitsBeforeStart = Math.min(
        (formatted.slice(0, start).match(/\d/g) || []).length,
        (priceRaw || "").length
      );
      const digitsBeforeEnd = Math.min(
        (formatted.slice(0, end).match(/\d/g) || []).length,
        (priceRaw || "").length
      );
      const cur = priceRaw || "";
      if (start !== end) {
        // remove selected digit range
        const newRaw =
          cur.slice(0, digitsBeforeStart) + cur.slice(digitsBeforeEnd);
        setBaseFromRaw(newRaw);
      } else {
        // remove digit before caret
        const removeIdx = digitsBeforeStart - 1;
        if (removeIdx < 0) {
          // nothing to remove
          return;
        }
        const newRaw = cur.slice(0, removeIdx) + cur.slice(removeIdx + 1);
        setBaseFromRaw(newRaw);
      }
      return;
    }

    // Delete: xoá các chữ số đã chọn hoặc chữ số tại vị trí caret
    if (key === "Delete") {
      e.preventDefault();
      const el = priceElRef.current;
      if (!el) return;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const formatted = priceInput || "";
      const digitsBeforeStart = Math.min(
        (formatted.slice(0, start).match(/\d/g) || []).length,
        (priceRaw || "").length
      );
      const digitsBeforeEnd = Math.min(
        (formatted.slice(0, end).match(/\d/g) || []).length,
        (priceRaw || "").length
      );
      const cur = priceRaw || "";
      if (start !== end) {
        const newRaw =
          cur.slice(0, digitsBeforeStart) + cur.slice(digitsBeforeEnd);
        setBaseFromRaw(newRaw);
      } else {
        // remove digit at caret (if exists)
        if (digitsBeforeStart >= cur.length) return;
        const newRaw =
          cur.slice(0, digitsBeforeStart) + cur.slice(digitsBeforeStart + 1);
        setBaseFromRaw(newRaw);
      }
      return;
    }

    // chặn các phím khác
    e.preventDefault();
  }

  function handlePricePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = (e.clipboardData && e.clipboardData.getData("text")) || "";
    const digits = pasted.replace(/\D/g, "");
    if (!digits) return;
    const el = e.currentTarget as HTMLInputElement;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const cur = priceRaw || "";
    // replace selected range with pasted digits
    const formatted = priceInput || "";
    const digitsBeforeStart = Math.min(
      (formatted.slice(0, start).match(/\d/g) || []).length,
      (priceRaw || "").length
    );
    const digitsBeforeEnd = Math.min(
      (formatted.slice(0, end).match(/\d/g) || []).length,
      (priceRaw || "").length
    );
    const newRaw =
      cur.slice(0, digitsBeforeStart) + digits + cur.slice(digitsBeforeEnd);
    // clamp if too large
    const asNum = Number(newRaw || 0);
    setBaseFromRaw(asNum > BASE_MAX ? String(BASE_MAX) : newRaw);
  }

  useEffect(() => {
    // sync local display when parent formData.price changes
    setPriceInput(formData.price != null ? formatVnd(formData.price) : "");
  }, [formData.price]);

  useEffect(() => {
    // if transaction_type changes away from sell, clear display
    if (formData.transaction_type !== "sell") setPriceInput("");
  }, [formData.transaction_type]);

  // show errors only after field blur or after an attempted submit
  const [touched, setTouched] = useState<{
    title?: boolean;
    description?: boolean;
    price?: boolean;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  function formatVnd(value: number | null | undefined) {
    return value != null ? Number(value).toLocaleString("vi-VN") : "";
  }

  // returns an object with validity and the collected errors so callers can
  // immediately inspect which field failed (avoids relying on async setState)
  function validate() {
    const e: { title?: string; description?: string; price?: string } = {};
    if (!formData.title || !formData.title.trim())
      e.title = "Tiêu đề là bắt buộc";
    if (!formData.description || !formData.description.trim())
      e.description = "Mô tả là bắt buộc";

    // price validation only when selling
    if (formData.transaction_type === "sell") {
      const price = formData.price;
      if (price == null || Number.isNaN(price)) {
        e.price = "Giá là bắt buộc khi chọn 'Bán'";
      } else if (price < 0) {
        e.price = "Giá phải lớn hơn hoặc bằng 0";
      } else if (price > PRICE_MAX) {
        e.price = `Giá phải nhỏ hơn hoặc bằng ${PRICE_MAX.toLocaleString()} VND`;
      } else {
        const step = 1000;
        // allow integers that are multiples of step
        if (Math.abs(price % step) !== 0) {
          e.price = `Giá phải là bội số của ${step.toLocaleString()} VND`;
        }
      }
    }

    setErrors(e);
    return { valid: Object.keys(e).length === 0, errors: e };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const result = validate();
    if (!result.valid) {
      showMessage?.("Vui lòng nhập đầy đủ tiêu đề và mô tả.");
      // focus first invalid using the returned errors (not the state)
      if (result.errors.title) titleRef.current?.focus();
      else if (result.errors.description) descRef.current?.focus();
      else if (result.errors.price) {
        // focus price input if present
        const priceEl = document.getElementById(
          "price"
        ) as HTMLInputElement | null;
        priceEl?.focus();
      }
      return;
    }
    onNext();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.sectionTitle}>2. Thông tin cơ bản</h2>

      <div className={styles.field}>
        <div className={styles.fieldHeader}>
          <label className={styles.label} htmlFor="title">
            Tiêu đề tin đăng <span className={styles.required}>*</span>
          </label>
          <span className={styles.charCount}>
            {formData.title?.length ?? 0}/100
          </span>
        </div>
        <input
          ref={titleRef}
          id="title"
          className={`${styles.input} ${errors.title && (submitted || touched.title) ? styles.inputError : ""}`}
          required
          aria-describedby={
            errors.title && (submitted || touched.title)
              ? "error-title"
              : undefined
          }
          value={formData.title}
          onChange={(e) =>
            setFormData((fd) => ({ ...fd, title: e.target.value }))
          }
          onBlur={() => setTouched((t) => ({ ...t, title: true }))}
          {...(errors.title && (submitted || touched.title)
            ? { "aria-invalid": "true" }
            : {})}
        />
        {errors.title && (submitted || touched.title) && (
          <div id="error-title" role="alert" className={styles.fieldError}>
            {errors.title}
          </div>
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.fieldHeader}>
          <label className={styles.label} htmlFor="description">
            Mô tả chi tiết <span className={styles.required}>*</span>
          </label>
          <span className={styles.charCount}>
            {formData.description?.length ?? 0}/1000
          </span>
        </div>
        <textarea
          ref={descRef}
          id="description"
          className={`${styles.textarea} ${errors.description && (submitted || touched.description) ? styles.inputError : ""}`}
          required
          aria-describedby={
            errors.description && (submitted || touched.description)
              ? "error-description"
              : undefined
          }
          value={formData.description}
          onChange={(e) =>
            setFormData((fd) => ({ ...fd, description: e.target.value }))
          }
          onBlur={() => setTouched((t) => ({ ...t, description: true }))}
          {...(errors.description && (submitted || touched.description)
            ? { "aria-invalid": "true" }
            : {})}
        />
        {errors.description && (submitted || touched.description) && (
          <div
            id="error-description"
            role="alert"
            className={styles.fieldError}
          >
            {errors.description}
          </div>
        )}
      </div>

      <div className={styles.twoCols}>
        <div className={styles.col}>
          <label className={styles.label} htmlFor="condition">
            Tình trạng
          </label>
          <select
            id="condition"
            className={`${styles.select}`}
            value={formData.condition}
            onChange={(e) =>
              setFormData((fd) => ({
                ...fd,
                condition: e.target.value as FormData["condition"],
              }))
            }
          >
            <option value="new">Mới</option>
            <option value="like new">Như mới</option>
            <option value="used">Đã sử dụng</option>
            <option value="minor flaw">Hư nhẹ</option>
            <option value="for repair">Cần sửa chữa</option>
          </select>
        </div>

        <div className={styles.col}>
          <label className={styles.label} htmlFor="transaction_type">
            Hình thức giao dịch
          </label>
          <select
            id="transaction_type"
            className={`${styles.select} ${errors.price && (submitted || touched.price) ? styles.inputError : ""}`}
            value={formData.transaction_type}
            onChange={(e) =>
              setFormData((fd) => ({
                ...fd,
                transaction_type: e.target
                  .value as FormData["transaction_type"],
                // clear price when switching away from sell to avoid stale value
                price: e.target.value === "sell" ? fd.price : null,
              }))
            }
          >
            <option value="sell">Bán</option>
            <option value="exchange">Trao đổi</option>
            <option value="give away">Tặng</option>
          </select>
        </div>
      </div>

      {formData.transaction_type === "sell" && (
        <>
          <label className={styles.label} htmlFor="price">
            Giá tiền (VND)
          </label>
          <div className={styles.inputWithSuffix}>
            <input
              type="text"
              id="price"
              inputMode="numeric"
              pattern="[0-9,.]*"
              placeholder="0"
              className={`${styles.input} ${errors.price && (submitted || touched.price) ? styles.inputError : ""}`}
              ref={(el) => {
                priceElRef.current = el;
              }}
              value={priceInput}
              required
              aria-describedby={
                errors.price && (submitted || touched.price)
                  ? "error-price"
                  : "price-help"
              }
              role="spinbutton"
              aria-valuetext={
                formData.price != null ? formatVnd(formData.price) : undefined
              }
              data-step={PRICE_STEP}
              data-min={PRICE_MIN}
              onKeyDown={handlePriceKeyDown}
              onPaste={handlePricePaste}
              onChange={(e) => {
                // Normalize input digits and update base via shared helper so
                // formatting and caret are handled consistently
                const raw = e.target.value.replace(/\D/g, "");
                setBaseFromRaw(raw);
              }}
              onFocus={() => {
                const base = baseRef.current != null ? baseRef.current : null;
                const value = base != null ? base * PRICE_STEP : null;
                setPriceRaw(base != null ? String(base) : "");
                if (base != null && Number.isFinite(base)) {
                  setPriceInput(`${base.toLocaleString("vi-VN")}.000`);
                } else if (Number.isFinite(value as number)) {
                  setPriceInput(formatVnd(value as number));
                } else {
                  setPriceInput("");
                }
                // position caret before suffix
                setTimeout(() => {
                  const el = priceElRef.current;
                  if (!el) return;
                  const pos = Math.max(
                    0,
                    (value != null ? formatVnd(value) : "").length - 4
                  );
                  el.setSelectionRange(pos, pos);
                }, 0);
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, price: true }));
                let base = priceRaw ? Number(priceRaw) : null;
                if (base != null) {
                  if (!Number.isFinite(base)) base = null;
                  else if (base > BASE_MAX) base = BASE_MAX;
                  else if (base < 0) base = 0;
                }
                baseRef.current = base;
                const value = base != null ? base * PRICE_STEP : null;
                setFormData((fd) => ({ ...fd, price: value }));
                if (base != null && Number.isFinite(base)) {
                  setPriceInput(`${base.toLocaleString("vi-VN")}.000`);
                } else if (Number.isFinite(value as number)) {
                  setPriceInput(formatVnd(value as number));
                } else {
                  setPriceInput("");
                }
              }}
              {...(errors.price && (submitted || touched.price)
                ? { "aria-invalid": "true" }
                : {})}
            />
            <span className={styles.suffix}>VND</span>
          </div>
          <div id="price-help" className={styles.helperText}>
            Nhập số, theo bước 1.000 VND (ví dụ: 1.000.000)
          </div>
          {errors.price && (
            <div id="error-price" role="alert" className={styles.fieldError}>
              {errors.price}
            </div>
          )}
        </>
      )}

      <div className={stylesCategoryForm.actionsRow}>
        <button type="button" className={styles.btnSecondary} onClick={onPrev}>
          Quay lại
        </button>
        <button type="submit" className={styles.btnPrimary}>
          Tiếp theo
        </button>
      </div>
    </form>
  );
}
