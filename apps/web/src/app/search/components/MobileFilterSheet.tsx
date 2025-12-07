"use client";

import React from "react";
import { Icon } from "@iconify/react";
import styles from "./MobileFilterSheet.module.scss";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeFiltersCount: number;
  children: React.ReactNode;
  onApply?: () => void;
  onReset?: () => void;
}

/**
 * Bottom Sheet cho filters trên mobile
 * - Slide up animation từ bottom
 * - Drag to close
 * - Apply và Reset buttons
 */
export default function MobileFilterSheet({
  isOpen,
  onClose,
  activeFiltersCount,
  children,
  onApply,
  onReset,
}: MobileFilterSheetProps) {
  if (!isOpen) return null;

  const handleApply = () => {
    onApply?.();
    onClose();
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Bottom Sheet */}
      <div className={styles.bottomSheet}>
        {/* Header */}
        <div className={styles.sheetHeader}>
          <div className={styles.dragHandle} />
          <div className={styles.headerContent}>
            <h3 className={styles.title}>
              <Icon icon="mdi:filter-variant" width={20} height={20} />
              Bộ lọc
              {activeFiltersCount > 0 && (
                <span className={styles.filterBadge}>
                  {activeFiltersCount}
                </span>
              )}
            </h3>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Đóng"
            >
              <Icon icon="mdi:close" width={24} height={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.sheetContent}>{children}</div>

        {/* Footer Actions */}
        <div className={styles.sheetFooter}>
          <button className={styles.resetButton} onClick={handleReset}>
            <Icon icon="mdi:refresh" width={18} height={18} />
            Đặt lại
          </button>
          <button className={styles.applyButton} onClick={handleApply}>
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng
          </button>
        </div>
      </div>
    </>
  );
}
