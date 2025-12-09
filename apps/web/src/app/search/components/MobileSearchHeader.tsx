"use client";

import React from "react";
import { Icon } from "@iconify/react";
import styles from "./MobileSearchHeader.module.scss";

interface MobileSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onBackClick?: () => void;
  resultCount: number;
}

export default function MobileSearchHeader({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onBackClick,
  resultCount,
}: MobileSearchHeaderProps) {
  const handleClear = () => {
    onSearchChange("");
  };

  return (
    <div className={styles.mobileHeader}>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        {onBackClick && (
          <button
            className={styles.backButton}
            onClick={onBackClick}
            aria-label="Quay lại"
          >
            <Icon icon="mdi:arrow-left" width={24} height={24} />
          </button>
        )}

        <div className={styles.searchInputWrapper}>
          <Icon
            icon="mdi:magnify"
            width={20}
            height={20}
            className={styles.searchIcon}
          />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearchSubmit();
              }
            }}
          />
          {searchQuery && (
            <button
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Xóa tìm kiếm"
            >
              <Icon icon="mdi:close-circle" width={18} height={18} />
            </button>
          )}
        </div>
      </div>

      {/* Result Info */}
      <div className={styles.resultInfo}>
        <span className={styles.resultCount}>
          {resultCount > 0 ? (
            <>
              Tìm thấy <strong>{resultCount}</strong> kết quả
            </>
          ) : (
            "Không có kết quả"
          )}
        </span>
      </div>
    </div>
  );
}
