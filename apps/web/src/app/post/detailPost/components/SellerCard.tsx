import React from "react";
import { Icon } from "@iconify/react";
import { formatImageUrl } from "@/lib/constants";
import styles from "./SellerCard.module.scss";

interface User {
  avatar: string;
  full_name: string;
  is_verified?: boolean;
  post_count?: number;
  review_count?: number;
  reputation?: {
    total_score: number;
    total_ratings: number;
  };
}

interface SellerCardProps {
  user: User;
  createRipple: (e: React.MouseEvent, btn?: HTMLElement) => void;
}

const SellerCard: React.FC<SellerCardProps> = ({ user, createRipple }) => {
  const reputationScore = (data: any) => {
    if (!data.reputation || data.reputation.total_ratings === 0) return 0;
    return parseFloat(
      (data.reputation.total_score / data.reputation.total_ratings).toFixed(1)
    );
  };

  const renderRating = (score: number) => {
    const full = Math.floor(score);
    const half = score % 1 !== 0;
    const items = [] as React.ReactNode[];
    for (let i = 0; i < 5; i++) {
      if (i < full)
        items.push(
          <Icon
            key={i}
            icon="lucide:star"
            className={`${styles["rating-star"]}`}
            width={16}
            height={16}
          />
        );
      else if (i === full && half)
        items.push(
          <Icon
            key={i}
            icon="lucide:star-half"
            className={`${styles["rating-star"]}`}
            width={16}
            height={16}
          />
        );
      else
        items.push(
          <Icon
            key={i}
            icon="lucide:star"
            className={`${styles["rating-star"]} ${styles["empty"]}`}
            width={16}
            height={16}
          />
        );
    }
    return <div className={`${styles["rating-stars"]}`}>{items}</div>;
  };

  return (
    <div className={`${styles["seller-card"]}`}>
      <div className={`${styles["seller-head"]}`}>
        <img
          src={
            formatImageUrl(user.avatar) ||
            "/image/header/carbon_user-avatar-filled-alt.svg"
          }
          alt="seller"
        />
        <div>
          <div className={`${styles["seller-name"]}`}>
            {user.full_name}{" "}
            {user.is_verified ? (
              <Icon
                icon="lucide:badge-check"
                className={`${styles["verified-icon"]}`}
                width={16}
                height={16}
              />
            ) : null}
          </div>
          <div className={`${styles["seller-meta"]}`}>
            {user.post_count} bài đăng khác
          </div>
          <div className={`${styles["seller-rep"]}`}>
            {renderRating(reputationScore(user) || 0)}{" "}
            <span className={`${styles["seller-rep-text"]}`}>
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
