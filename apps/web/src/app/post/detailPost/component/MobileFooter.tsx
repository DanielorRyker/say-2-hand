// MobileFooter.tsx - Component hiển thị footer CTA trên mobile
import React from "react";
import styles from "./MobileFooter.module.scss";

interface MobileFooterProps {
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAction: () => void;
  transactionType: string;
}

// Component hiển thị footer CTA trên mobile
const MobileFooter: React.FC<MobileFooterProps> = ({
  isFavorite,
  onToggleFavorite,
  onAction,
  transactionType,
}) => {
  return (
    <div className={styles["mobile-footer"]}>
      <div className={styles["mobile-footer-inner"]}>
        <button
          type="button"
          className={`${styles["fav-btn"]} ${isFavorite ? styles["active"] : ""}`}
          onClick={onToggleFavorite}
          aria-label="Lưu yêu thích"
        >
          {isFavorite ? "Đã Lưu" : "Lưu"}
        </button>
        <button type="button" className={styles["chat-btn"]} onClick={onAction}>
          {transactionType === "sell" ? "Mua Ngay" : "Chat Ngay"}
        </button>
      </div>
    </div>
  );
};

export default MobileFooter;
