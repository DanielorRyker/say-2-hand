// SellerCard.tsx - Component hiển thị thông tin người bán
import React from "react";
import styles from "./SellerCard.module.scss";
import { Icon } from "@iconify/react";

import { formatImageUrl } from "@/lib/constants";

interface SellerCardProps {
  user: any;
  createRipple: (e: React.MouseEvent | MouseEvent) => void;
  reputationScore: (user: any) => number;
  renderRating: (score: number) => React.ReactNode;
}

// Component hiển thị thông tin người bán
const SellerCard: React.FC<SellerCardProps> = ({
  user,
  createRipple,
  reputationScore,
  renderRating,
}) => {
  return (
    <div className={styles["seller-card"]}>
      <div className={styles["seller-head"]}>
        {/* Hiển thị avatar, ưu tiên dùng formatImageUrl để xử lý link ảnh từ backend/GCS */}
        <img
          src={
            formatImageUrl(user.avatar) ||
            "/image/header/carbon_user-avatar-filled-alt.svg"
          }
          alt="seller"
        />
        <div>
          <div className={styles["seller-name"]}>
            {user.full_name}{" "}
            {user.is_verified ? (
              <Icon
                icon="lucide:badge-check"
                className={styles["verified-icon"]}
                width={16}
                height={16}
              />
            ) : null}
          </div>
          <div className={styles["seller-meta"]}>
            {user.post_count} bài đăng khác
          </div>
          <div className={styles["seller-rep"]}>
            {renderRating(reputationScore(user) || 0)}{" "}
            <span className={styles["seller-rep-text"]}>
              {reputationScore(user)}/5 ({user.review_count} đánh giá)
            </span>
          </div>
        </div>
      </div>
      <a
        className={`${styles["profile-link"]} ${styles["ripple-target"]}`}
        href="#"
        onClick={(e) => {
          createRipple(e as any);
        }}
      >
        <span>Xem Trang Cá Nhân</span>
        <Icon icon="lucide:chevron-right" width={16} height={16} />
      </a>
    </div>
  );
};

export default SellerCard;
