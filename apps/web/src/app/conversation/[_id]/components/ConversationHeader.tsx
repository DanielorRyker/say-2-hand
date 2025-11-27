import React from "react";
import { Icon } from "@iconify/react";
import styles from "./ConversationHeader.module.scss";
import { formatImageUrl } from "@/lib/constants";

// Component header hội thoại: hiển thị avatar, tên và trạng thái

// Thêm props: onBack (callback), isShowBack (có hiển thị nút back không)
const ConversationHeader = ({
  user,
  status,
  onBack,
  isShowBack,
}: {
  user: { name: string; avatarUrl?: string };
  status: string;
  onBack?: () => void;
  isShowBack?: boolean;
}) => {
  // Xử lý lấy url avatar, fallback nếu không có
  // Đảm bảo avatarUrl luôn là string hợp lệ
  let avatarUrl: string = "/default-avatar.png";
  if (user.avatarUrl) {
    const url = formatImageUrl(user.avatarUrl);
    if (url) avatarUrl = url;
  }
  // Bố cục header thông minh: back | avatar | info (tên + trạng thái)
  return (
    <header className={styles.header}>
      {/* Nút back chỉ hiển thị trên mobile/tablet nếu có props isShowBack */}
      {isShowBack && (
        <button
          className={styles.backButton}
          onClick={onBack}
          aria-label="Quay lại"
        >
          <Icon icon="mdi:arrow-left" width={28} height={28} />
        </button>
      )}
      <div className={styles.avatar}>
        {/* Hiển thị avatar, fallback nếu không có */}
        <img src={avatarUrl} alt="avatar" />
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{user.name}</div>
        <div className={styles.status}>
          <span
            className={status === "online" ? styles.online : styles.offline}
          ></span>
          <span>{status === "online" ? "Đang hoạt động" : "Ngoại tuyến"}</span>
        </div>
      </div>
    </header>
  );
};

export default ConversationHeader;
