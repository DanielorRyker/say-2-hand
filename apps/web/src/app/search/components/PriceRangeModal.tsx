"use client";

import { useState, useEffect, useCallback } from "react";
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

const MAX_PRICE = 100000000; // 100 triệu VNĐ

export default function PriceRangeModal({
  isOpen,
  onClose,
  priceRange,
  setPriceRange,
}: PriceRangeModalProps) {
  const [minValue, setMinValue] = useState(priceRange.min);
  const [maxValue, setMaxValue] = useState(priceRange.max);

  useEffect(() => {
    if (isOpen) {
      setMinValue(priceRange.min);
      setMaxValue(priceRange.max);
    }
  }, [isOpen, priceRange]);

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Math.min(Number(e.target.value), maxValue - 100000);
      setMinValue(value);
    },
    [maxValue]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(Number(e.target.value), minValue + 100000);
      setMaxValue(value);
    },
    [minValue]
  );

  const handleQuickSelect = (min: number, max: number) => {
    setMinValue(min);
    setMaxValue(max);
  };

  const handleApply = () => {
    setPriceRange({ min: minValue, max: maxValue });
    onClose();
  };

  const handleClear = () => {
    setMinValue(0);
    setMaxValue(MAX_PRICE);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)} triệu`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  if (!isOpen) return null;

  // Calculate percentage for slider range styling
  const minPercent = (minValue / MAX_PRICE) * 100;
  const maxPercent = (maxValue / MAX_PRICE) * 100;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>
            <Icon icon="mdi:currency-usd" width={24} height={24} />
            Chọn khoảng giá
          </h2>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <Icon icon="mdi:close" width={20} height={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Quick Range Buttons */}
          <div className={styles.section}>
            <h3>
              <Icon icon="mdi:lightning-bolt" width={18} height={18} />
              Chọn nhanh
            </h3>
            <div className={styles.quickRangeGrid}>
              {QUICK_RANGES.map((range) => (
                <button
                  key={range.label}
                  className={styles.quickRangeBtn}
                  onClick={() => handleQuickSelect(range.min, range.max)}
                  type="button"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dual Range Slider */}
          <div className={styles.section}>
            <h3>
              <Icon icon="mdi:tune" width={18} height={18} />
              Tùy chỉnh khoảng giá
            </h3>
            <div className={styles.rangeSliderContainer}>
              {/* Slider Track */}
              <div className={styles.sliderTrack}>
                <div
                  className={styles.sliderRange}
                  style={
                    {
                      "--min-percent": `${minPercent}%`,
                      "--range-width": `${maxPercent - minPercent}%`,
                    } as React.CSSProperties
                  }
                />
              </div>

              {/* Dual Range Inputs */}
              <div className={styles.sliderInputs}>
                <input
                  type="range"
                  min={0}
                  max={MAX_PRICE}
                  step={100000}
                  value={minValue}
                  onChange={handleMinChange}
                  className={styles.sliderInput}
                  aria-label="Giá tối thiểu"
                  title="Kéo để chọn giá tối thiểu"
                />
                <input
                  type="range"
                  min={0}
                  max={MAX_PRICE}
                  step={100000}
                  value={maxValue}
                  onChange={handleMaxChange}
                  className={styles.sliderInput}
                  aria-label="Giá tối đa"
                  title="Kéo để chọn giá tối đa"
                />
              </div>

              {/* Range Labels */}
              <div className={styles.rangeLabels}>
                <span>0đ</span>
                <span>{formatCurrency(MAX_PRICE)}</span>
              </div>
            </div>

            {/* Price Display Boxes */}
            <div className={styles.priceDisplay}>
              <div className={styles.priceBox}>
                <label>Từ</label>
                <div>
                  <span className={styles.price}>
                    {formatCurrency(minValue)}
                  </span>
                  <span className={styles.currency}>đ</span>
                </div>
              </div>

              <div className={styles.separator}>→</div>

              <div className={styles.priceBox}>
                <label>Đến</label>
                <div>
                  <span className={styles.price}>
                    {formatCurrency(maxValue)}
                  </span>
                  <span className={styles.currency}>đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            type="button"
          >
            <Icon icon="mdi:refresh" width={18} height={18} />
            Đặt lại
          </button>
          <button
            className={styles.applyBtn}
            onClick={handleApply}
            type="button"
          >
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
