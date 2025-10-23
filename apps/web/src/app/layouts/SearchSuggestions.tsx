"use client";

import { Icon } from "@iconify/react";
import styles from "./SearchSuggestions.module.scss";

interface SearchSuggestionsProps {
  isVisible: boolean;
  searchQuery: string;
  onSelect: (query: string) => void;
}

const POPULAR_SEARCHES = [
  { icon: "mdi:laptop", text: "Laptop cũ", category: "Đồ điện tử" },
  { icon: "mdi:cellphone", text: "iPhone", category: "Điện thoại" },
  { icon: "mdi:bike", text: "Xe đạp", category: "Xe cộ" },
  { icon: "mdi:sofa", text: "Sofa", category: "Đồ gia dụng" },
  {
    icon: "mdi:book-open-page-variant",
    text: "Sách giáo khoa",
    category: "Sách",
  },
];

const RECENT_SEARCHES = ["MacBook Pro 2020", "Bàn làm việc", "Áo khoác"];

export default function SearchSuggestions({
  isVisible,
  searchQuery,
  onSelect,
}: SearchSuggestionsProps) {
  if (!isVisible) return null;

  return (
    <div className={styles.suggestionsContainer}>
      {!searchQuery && (
        <>
          {/* Popular Searches */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Icon icon="mdi:fire" width={18} height={18} />
              <span>Tìm kiếm phổ biến</span>
            </div>
            <div className={styles.suggestionsList}>
              {POPULAR_SEARCHES.map((item, index) => (
                <button
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => onSelect(item.text)}
                >
                  <Icon
                    icon={item.icon}
                    width={20}
                    height={20}
                    className={styles.itemIcon}
                  />
                  <div className={styles.itemContent}>
                    <span className={styles.itemText}>{item.text}</span>
                    <span className={styles.itemCategory}>{item.category}</span>
                  </div>
                  <Icon
                    icon="mdi:arrow-top-left"
                    width={16}
                    height={16}
                    className={styles.itemArrow}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Icon icon="mdi:history" width={18} height={18} />
              <span>Tìm kiếm gần đây</span>
            </div>
            <div className={styles.suggestionsList}>
              {RECENT_SEARCHES.map((text, index) => (
                <button
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => onSelect(text)}
                >
                  <Icon
                    icon="mdi:clock-outline"
                    width={20}
                    height={20}
                    className={styles.itemIcon}
                  />
                  <span className={styles.itemText}>{text}</span>
                  <Icon
                    icon="mdi:arrow-top-left"
                    width={16}
                    height={16}
                    className={styles.itemArrow}
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {searchQuery && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Icon icon="mdi:magnify" width={18} height={18} />
            <span>Gợi ý tìm kiếm</span>
          </div>
          <div className={styles.suggestionsList}>
            <button
              className={styles.suggestionItem}
              onClick={() => onSelect(searchQuery)}
            >
              <Icon
                icon="mdi:magnify"
                width={20}
                height={20}
                className={styles.itemIcon}
              />
              <span className={styles.itemText}>
                Tìm kiếm: <strong>{searchQuery}</strong>
              </span>
              <Icon
                icon="mdi:arrow-top-left"
                width={16}
                height={16}
                className={styles.itemArrow}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
