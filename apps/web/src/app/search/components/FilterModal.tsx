"use client";

import React, { useEffect, useState } from "react";
import axios from "@/lib/api-client";
import { Icon } from "@iconify/react";
import styles from "./FilterModal.module.scss";
import CategoryDropdown from "./CategoryDropdown";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactionTypes: string[];
  setSelectedTransactionTypes: (types: string[]) => void;
  selectedConditions: string[];
  setSelectedConditions: (conditions: string[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number }) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  distance: number;
  setDistance: (distance: number) => void;
  onApply: () => void;
  onReset: () => void;
}

const TRANSACTION_TYPES = [
  { value: "sell", label: "Bán", icon: "mdi:cash", color: "#ef4444" },
  {
    value: "exchange",
    label: "Trao đổi",
    icon: "mdi:swap-horizontal",
    color: "#3b82f6",
  },
  { value: "give away", label: "Tặng", icon: "mdi:gift", color: "#10b981" },
];

const CONDITIONS = [
  { value: "new", label: "Mới 100%", color: "#10b981" },
  { value: "like_new", label: "Gần như mới", color: "#06b6d4" },
  { value: "used", label: "Đã sử dụng", color: "#3b82f6" },
  { value: "minor_flaw", label: "Hư nhẹ", color: "#f97316" },
  { value: "for_repair", label: "Cần sửa chữa", color: "#8b5cf6" },
  { value: "for_parts", label: "Đã hư", color: "#ef4444" },
];

export default function FilterModal({
  isOpen,
  onClose,
  selectedTransactionTypes,
  setSelectedTransactionTypes,
  selectedConditions,
  setSelectedConditions,
  selectedCategories,
  setSelectedCategories,
  priceRange,
  setPriceRange,
  distance,
  setDistance,
  onApply,
  onReset,
}: FilterModalProps) {
  // Note: keep hooks declared unconditionally so rules-of-hooks are satisfied.

  const toggleTransactionType = (type: string) => {
    if (selectedTransactionTypes.includes(type)) {
      setSelectedTransactionTypes(
        selectedTransactionTypes.filter((t) => t !== type)
      );
    } else {
      setSelectedTransactionTypes([...selectedTransactionTypes, type]);
    }
  };

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  interface Category {
    _id: string;
    name: string;
    parent_id?: string | null;
    icon?: string;
  }

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/categories");
        if (mounted) setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // categories state is used by CategoryDropdown component

  // Only render the modal content when open; hooks above always run so rules-of-hooks are satisfied
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>
            <Icon icon="mdi:filter-variant" width={24} height={24} />
            Bộ lọc tìm kiếm
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Category (first) */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>
              <Icon icon="mdi:shape" width={20} height={20} />
              Danh mục
            </h3>
            <div className={styles.dropdownGroup}>
              <CategoryDropdown
                categories={categories}
                value={selectedCategories[0] || undefined}
                onChange={(id) => {
                  if (!id) setSelectedCategories([]);
                  else setSelectedCategories([id]);
                }}
                placeholder="Tất cả"
              />
            </div>
          </div>

          {/* Transaction Types */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>
              <Icon icon="mdi:tag" width={20} height={20} />
              Loại giao dịch
            </h3>
            <div className={styles.chipGroup}>
              {TRANSACTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  className={`${styles.filterChip} ${selectedTransactionTypes.includes(type.value) ? styles.active : ""}`}
                  onClick={() => toggleTransactionType(type.value)}
                >
                  <Icon icon={type.icon} width={18} height={18} />
                  {type.label}
                  {selectedTransactionTypes.includes(type.value) && (
                    <Icon
                      icon="mdi:check"
                      width={16}
                      height={16}
                      className={styles.checkIcon}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>
              <Icon icon="mdi:check-circle" width={20} height={20} />
              Tình trạng
            </h3>
            <div className={styles.chipGroup}>
              {CONDITIONS.map((condition) => (
                <button
                  key={condition.value}
                  className={`${styles.filterChip} ${selectedConditions.includes(condition.value) ? styles.active : ""}`}
                  onClick={() => toggleCondition(condition.value)}
                >
                  {condition.label}
                  {selectedConditions.includes(condition.value) && (
                    <Icon
                      icon="mdi:check"
                      width={16}
                      height={16}
                      className={styles.checkIcon}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>
              <Icon icon="mdi:currency-usd" width={20} height={20} />
              Khoảng giá
            </h3>
            <div className={styles.priceInputs}>
              <div className={styles.inputGroup}>
                <label>Từ (VND)</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange({
                      ...priceRange,
                      min: Number(e.target.value),
                    })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              <span className={styles.separator}>-</span>
              <div className={styles.inputGroup}>
                <label>Đến (VND)</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange({
                      ...priceRange,
                      max: Number(e.target.value),
                    })
                  }
                  placeholder="100,000,000"
                  min="0"
                />
              </div>
            </div>
            <div className={styles.priceDisplay}>
              {formatCurrency(priceRange.min)} -{" "}
              {formatCurrency(priceRange.max)} VND
            </div>
          </div>

          {/* Distance */}
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>
              <Icon icon="mdi:map-marker-radius" width={20} height={20} />
              Khoảng cách tối đa: {distance} km
            </h3>
            <input
              type="range"
              min="1"
              max="100"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className={styles.rangeSlider}
              title="Khoảng cách"
              aria-label="Chọn khoảng cách tối đa"
            />
            <div className={styles.rangeLabels}>
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.resetBtn} onClick={onReset}>
            <Icon icon="mdi:refresh" width={18} height={18} />
            Đặt lại
          </button>
          <button className={styles.applyBtn} onClick={onApply}>
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
