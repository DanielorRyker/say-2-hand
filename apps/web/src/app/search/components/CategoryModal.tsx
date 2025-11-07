"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import styles from "./CategoryModal.module.scss";
import axios from "axios";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  selectedCategories,
  setSelectedCategories,
}: CategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSearchTerm("");
      setActiveParentId(null);
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Phân loại danh mục cha và con
  const { parentCategories, subcategories } = useMemo(() => {
    const parents = categories.filter((cat) => !cat.parent_id);
    const children = categories.filter((cat) => cat.parent_id);
    return { parentCategories: parents, subcategories: children };
  }, [categories]);

  // Lọc theo search
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return {
        parents: parentCategories,
        children: activeParentId
          ? subcategories.filter((sub) => sub.parent_id === activeParentId)
          : subcategories,
      };
    }

    const term = searchTerm.toLowerCase();
    const matchedParents = parentCategories.filter((cat) =>
      cat.name.toLowerCase().includes(term)
    );
    const matchedChildren = subcategories.filter((cat) =>
      cat.name.toLowerCase().includes(term)
    );

    return { parents: matchedParents, children: matchedChildren };
  }, [searchTerm, parentCategories, subcategories, activeParentId]);

  const toggleCategory = (categoryId: string) => {
    // Chỉ cho phép chọn một danh mục mỗi lần
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([categoryId]);
    }
  };

  const handleParentClick = (parentId: string) => {
    // Nếu click vào parent đang active thì toggle selection trực tiếp
    if (activeParentId === parentId) {
      toggleCategory(parentId);
    } else {
      // Chuyển sang xem subcategories của parent này
      // Nếu parent có subcategories, chỉ hiển thị chúng
      // Nếu không có subcategories, tự động chọn parent
      const hasSubcategories = subcategories.some(
        (sub) => sub.parent_id === parentId
      );

      if (!hasSubcategories) {
        // Không có danh mục con -> chọn luôn danh mục cha
        setSelectedCategories([parentId]);
      }
      setActiveParentId(parentId);
    }
  };

  const getCategoryName = (id: string) => {
    return categories.find((cat) => cat._id === id)?.name || "";
  };

  const displayedSubcategories = useMemo(() => {
    if (searchTerm) return filteredData.children;
    if (!activeParentId) return [];
    return subcategories.filter((sub) => sub.parent_id === activeParentId);
  }, [searchTerm, activeParentId, subcategories, filteredData.children]);

  // Hàm xử lý khi apply: nếu đang xem parent mà chưa chọn con nào, tự động chọn parent
  const handleApply = () => {
    if (activeParentId && displayedSubcategories.length > 0) {
      // Kiểm tra xem có con nào của parent này được chọn không
      const hasSelectedChildren = displayedSubcategories.some((sub) =>
        selectedCategories.includes(sub._id)
      );

      // Nếu không có con nào được chọn, tự động chọn parent
      if (!hasSelectedChildren) {
        setSelectedCategories([activeParentId]);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const showingSubcategories = activeParentId && !searchTerm;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>
            <Icon icon="mdi:shape" width={24} height={24} />
            {showingSubcategories
              ? getCategoryName(activeParentId)
              : "Chọn danh mục"}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <Icon icon="mdi:magnify" width={20} height={20} />
          <input
            type="text"
            placeholder="Tìm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm("")}
              title="Xóa tìm kiếm"
              aria-label="Xóa tìm kiếm"
            >
              <Icon icon="mdi:close-circle" width={18} height={18} />
            </button>
          )}
        </div>

        {/* NOTE: removed 'Quay lại tất cả danh mục' back button per UX request */}

        {/* Body - Split Panel: left nav (parents) + right panel (subcats / search results) */}
        <div className={styles.modalBody}>
          <div className={styles.splitContainer}>
            <nav className={styles.leftNav} aria-label="Danh mục chính">
              {/* All item */}
              <button
                key="__all__"
                className={`${styles.navItem} ${!activeParentId ? styles.activeNav : ""}`}
                onClick={() => setActiveParentId(null)}
                aria-current={!activeParentId ? "true" : undefined}
                title="Tất cả danh mục"
              >
                <span className={styles.navLabel}>Tất cả</span>
              </button>

              {filteredData.parents.map((parent) => {
                const isActive = activeParentId === parent._id;
                const isSelected = selectedCategories.includes(parent._id);
                return (
                  <button
                    key={parent._id}
                    className={`${styles.navItem} ${isActive ? styles.activeNav : ""} ${isSelected ? styles.selectedNav : ""}`}
                    onClick={() => handleParentClick(parent._id)}
                    aria-current={isActive ? "true" : undefined}
                    title={parent.name}
                  >
                    <span className={styles.navLabel}>
                      {parent.icon && (
                        <Icon icon={parent.icon} width={16} height={16} />
                      )}{" "}
                      {parent.name}
                    </span>
                    {isSelected && (
                      <Icon icon="mdi:check" width={14} height={14} />
                    )}
                  </button>
                );
              })}
            </nav>

            <section className={styles.rightPanel} aria-label="Danh mục phụ">
              {/* If searchTerm present, show matched parents+children as chips */}
              {searchTerm && filteredData.children.length > 0 && (
                <div className={styles.resultsHeader}>Kết quả</div>
              )}

              {searchTerm && filteredData.children.length === 0 && (
                <div className={styles.emptyStateSmall}>
                  Không tìm thấy kết quả
                </div>
              )}

              {/* Show subcategories for active parent */}
              {!searchTerm &&
                activeParentId &&
                displayedSubcategories.length === 0 && (
                  <div className={styles.emptyStateSmall}>
                    Danh mục này chưa có mục con
                  </div>
                )}

              <div className={styles.subList}>
                {(searchTerm
                  ? filteredData.children
                  : displayedSubcategories
                ).map((cat) => {
                  const isSel = selectedCategories.includes(cat._id);
                  return (
                    <button
                      key={cat._id}
                      className={`${styles.subItem} ${isSel ? styles.selected : ""}`}
                      onClick={() => toggleCategory(cat._id)}
                    >
                      <span className={styles.subLabel}>{cat.name}</span>
                      {isSel && (
                        <Icon
                          icon="mdi:check-circle"
                          width={16}
                          height={16}
                          className={styles.check}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            className={styles.clearBtn}
            onClick={() => setSelectedCategories([])}
            disabled={selectedCategories.length === 0}
          >
            <Icon icon="mdi:close-circle" width={18} height={18} />
            Xóa chọn
          </button>
          <button className={styles.applyBtn} onClick={handleApply}>
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng ({selectedCategories.length})
          </button>
        </div>
      </div>
    </div>
  );
}
