"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import styles from "./PriceRangeModal.module.scss";

interface PriceRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
}

const QUICK_RANGES = [
  { label: "Dưới 1 triệu", min: 0, max: 1000000 },
  { label: "1-5 triệu", min: 1000000, max: 5000000 },
  { label: "5-10 triệu", min: 5000000, max: 10000000 },
  { label: "10-20 triệu", min: 10000000, max: 20000000 },
  { label: "20-50 triệu", min: 20000000, max: 50000000 },
  { label: "Trên 50 triệu", min: 50000000, max: 100000000 },
];

export default function PriceRangeModal({
  isOpen,
  onClose,
  priceRange,
  setPriceRange,
}: PriceRangeModalProps) {
  const [localMin, setLocalMin] = useState(priceRange.min);
  const [localMax, setLocalMax] = useState(priceRange.max);

  if (!isOpen) return null;

  const handleApply = () => {
    setPriceRange({ min: localMin, max: localMax });
    onClose();
  };

  const handleQuickSelect = (min: number, max: number) => {
    setLocalMin(min);
    setLocalMax(max);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <Icon icon="mdi:currency-usd" width={24} height={24} />
            Chọn khoảng giá
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Quick Range Buttons */}
          <div className={styles.section}>
            <h3>Chọn nhanh</h3>
            <div className={styles.quickRangeGrid}>
              {QUICK_RANGES.map((range, index) => (
                <button
                  key={index}
                  className={`${styles.quickRangeBtn} ${
                    localMin === range.min && localMax === range.max
                      ? styles.active
                      : ""
                  }`}
                  onClick={() => handleQuickSelect(range.min, range.max)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range Inputs */}
          <div className={styles.section}>
            <h3>Khoảng giá tùy chỉnh</h3>
            <div className={styles.priceInputs}>
              <div className={styles.inputGroup}>
                <label>Từ (VND)</label>
                <input
                  type="number"
                  value={localMin}
                  onChange={(e) => setLocalMin(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
                <span className={styles.currencyLabel}>
                  {formatCurrency(localMin)} đ
                </span>
              </div>

              <span className={styles.separator}>
                <Icon icon="mdi:arrow-right" width={24} height={24} />
              </span>

              <div className={styles.inputGroup}>
                <label>Đến (VND)</label>
                <input
                  type="number"
                  value={localMax}
                  onChange={(e) => setLocalMax(Number(e.target.value))}
                  placeholder="100,000,000"
                  min="0"
                />
                <span className={styles.currencyLabel}>
                  {formatCurrency(localMax)} đ
                </span>
              </div>
            </div>
          </div>

          {/* Range Preview */}
          <div className={styles.rangePreview}>
            <Icon icon="mdi:information" width={20} height={20} />
            <span>
              Tìm kiếm trong khoảng:{" "}
              <strong>{formatCurrency(localMin)} đ</strong> -{" "}
              <strong>{formatCurrency(localMax)} đ</strong>
            </span>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setLocalMin(0);
              setLocalMax(100000000);
            }}
          >
            <Icon icon="mdi:refresh" width={18} height={18} />
            Đặt lại
          </button>
          <button className={styles.applyBtn} onClick={handleApply}>
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
