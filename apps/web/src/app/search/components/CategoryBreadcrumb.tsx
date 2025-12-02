"use client";

import React from "react";
import { Icon } from "@iconify/react";
import styles from "./CategoryBreadcrumb.module.scss";

interface Category {
  _id: string;
  name: string;
  parent_id?: string | null;
}

interface CategoryBreadcrumbProps {
  categoryId: string;
  categories: Category[];
  onCategoryClick?: (categoryId: string) => void;
}

/**
 * Component hiển thị breadcrumb cho category hierarchy
 * Ví dụ: Điện tử > Điện thoại > iPhone
 */
export default function CategoryBreadcrumb({
  categoryId,
  categories,
  onCategoryClick,
}: CategoryBreadcrumbProps) {
  // Tìm category hiện tại
  const currentCategory = categories.find((c) => c._id === categoryId);
  if (!currentCategory) return null;

  // Build breadcrumb path từ child lên parent
  const buildPath = (cat: Category): Category[] => {
    const path: Category[] = [cat];

    if (cat.parent_id) {
      const parent = categories.find((c) => c._id === cat.parent_id);
      if (parent) {
        path.unshift(...buildPath(parent));
      }
    }

    return path;
  };

  const breadcrumbPath = buildPath(currentCategory);

  // Nếu chỉ có 1 item (root category), không hiển thị breadcrumb
  if (breadcrumbPath.length <= 1) {
    return (
      <div className={styles.breadcrumb}>
        <span className={styles.categoryName}>{currentCategory.name}</span>
      </div>
    );
  }

  return (
    <nav className={styles.breadcrumb} aria-label="Category breadcrumb">
      {breadcrumbPath.map((cat, index) => {
        const isLast = index === breadcrumbPath.length - 1;

        return (
          <React.Fragment key={cat._id}>
            {index > 0 && (
              <Icon
                icon="mdi:chevron-right"
                width={16}
                height={16}
                className={styles.separator}
              />
            )}

            {isLast ? (
              <span className={styles.currentCategory}>{cat.name}</span>
            ) : (
              <button
                className={styles.categoryLink}
                onClick={() => onCategoryClick?.(cat._id)}
                type="button"
              >
                {cat.name}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
