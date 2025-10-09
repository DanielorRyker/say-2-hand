"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import styles from "./ImageUploader.module.scss";

type Props = {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedFiles?: React.Dispatch<React.SetStateAction<File[]>>; // thêm dòng này
  showMessage?: (msg: string) => void;
  coverIndexProp?: number | null;
  setCoverIndexProp?: (i: number) => void;
};


export default function ImageUploader({
  images,
  setImages,
  showMessage,
  coverIndexProp,
  setCoverIndexProp,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewsRef = useRef<HTMLDivElement | null>(null);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [coverIndex, setCoverIndex] = useState<number>(0);

  const effectiveCover = coverIndexProp ?? coverIndex;
  const setEffectiveCover = (i: number) => {
    if (setCoverIndexProp) setCoverIndexProp(i);
    else setCoverIndex(i);
  };

  useEffect(() => {
    const el = previewsRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setShowScrollbar(el.scrollWidth > el.clientWidth + 1);
      const scrollWidth =
        el.clientWidth * (el.clientWidth / (el.scrollWidth || el.clientWidth));
      const scrollLeft =
        (el.scrollLeft / (el.scrollWidth || 1)) * el.clientWidth || 0;
      el.style.setProperty("--scroll-width", `${Math.max(0, scrollWidth)}px`);
      el.style.setProperty("--scroll-left", `${Math.max(0, scrollLeft)}px`);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    el.addEventListener("scroll", checkOverflow);

    const imgs: HTMLImageElement[] = Array.from(el.querySelectorAll("img"));
    const onImgLoad = () => checkOverflow();
    imgs.forEach((img) => img.addEventListener("load", onImgLoad));

    return () => {
      window.removeEventListener("resize", checkOverflow);
      el.removeEventListener("scroll", checkOverflow);
      imgs.forEach((img) => img.removeEventListener("load", onImgLoad));
    };
  }, [images]);


  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
  const files = e.target.files;
  if (!files) return;

  // Giới hạn 10 ảnh
  if (images.length + files.length > 10) {
    showMessage?.("Chỉ được tải lên tối đa 10 ảnh!");
    e.currentTarget.value = "";
    return;
  }

  // Đọc file -> base64 -> cập nhật state + localStorage
  const newFiles = Array.from(files);

  const readers = newFiles.map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
  );

  Promise.all(readers)
    .then((base64Arr) => {
      setImages((prev: string[]) => {
        const updated = [...prev, ...base64Arr].slice(0, 10); // không vượt quá 10
        localStorage.setItem("uploadedImages", JSON.stringify(updated)); // ✅ lưu vào localStorage
        return updated;
      });
      if (images.length === 0) setCoverIndex(0);
    })
    .catch((err) => console.error("Error reading files:", err));

  e.currentTarget.value = "";
}


  function removeIndex(i: number) {
    setImages((prev: string[]) => prev.filter((_, idx) => idx !== i));
    setCoverIndex((prev) => {
      if (i === prev) return 0;
      if (i < prev) return Math.max(0, prev - 1);
      return prev;
    });
  }

  useEffect(() => {
    if (images.length === 0) setCoverIndex(0);
    else if (coverIndex >= images.length) setCoverIndex(0);
  }, [images, coverIndex]);

  const displayOrder: number[] = [];
  if (images.length > 0) {
    const first = Math.min(Math.max(0, effectiveCover), images.length - 1);
    displayOrder.push(first);
    for (let idx = 0; idx < images.length; idx++)
      if (idx !== first) displayOrder.push(idx);
  }

  //Lưu ảnh vào localStorage để tránh mất khi reload

useEffect(() => {
  localStorage.setItem("uploadedImages", JSON.stringify(images));
}, [images]);


  return (
    <div>
      <div className={styles.previewContainer}>
        <div
          ref={previewsRef}
          className={
            styles.previews + (showScrollbar ? ` ${styles.showScrollbar}` : "")
          }
          onWheel={(e) => {
            const el = previewsRef.current;
            if (!el) return;
            if (Math.abs(e.deltaY) > 0) {
              el.scrollLeft += e.deltaY;
              e.preventDefault();
            }
          }}
        >
          <div
            className={styles.addBox}
            onClick={() => inputRef.current?.click()}
          >
            <input
              aria-label="Tải ảnh"
              title="Tải ảnh"
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className={styles.hiddenInput}
              onChange={onFiles}
            />
            <div className={styles.addInner}>
              <svg
                className={styles.imgLarge}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                role="img"
              >
                <defs>
                  <linearGradient
                    id="plus-grad"
                    x1="100%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
                <path
                  className={styles.plusGray}
                  d="M6 12H18M12 6V18"
                  stroke="#d1d5db"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  className={styles.plusGrad}
                  d="M6 12H18M12 6V18"
                  stroke="url(#plus-grad)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {displayOrder.map((idx) => {
            const src = images[idx];
            const isCover = idx === effectiveCover;
            return (
              <div className={styles.imagePreview} key={idx}>
                <Image
                  className={styles.img}
                  src={src}
                  alt={`preview-${idx}`}
                  width={150}
                  height={150}
                />

                {isCover ? (
                  <div className={styles.coverBadge} aria-hidden="true">
                    Bìa
                  </div>
                ) : (
                  <button
                    className={styles.makeCoverBtn}
                    aria-label={`Đặt ảnh ${idx + 1} làm ảnh bìa`}
                    onClick={() => setEffectiveCover(idx)}
                  >
                    Đặt bìa
                  </button>
                )}

                <button
                  aria-label={`Xóa ảnh ${idx + 1}`}
                  className={styles.deleteBtn}
                  onClick={() => removeIndex(idx)}
                >
                  <Image
                    className={styles.imgSmall}
                    src="/image/create_post/close.svg"
                    alt="Xóa"
                    width={15}
                    height={15}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <p className={styles.hint}>
        Tối thiểu 1 ảnh, tối đa 10 ảnh. Cuộn ngang để xem tất cả.
      </p>
    </div>

  );
}
