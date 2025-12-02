// InfoCard.tsx - Component hiển thị thông tin sản phẩm (giá, trạng thái, meta)
import React from "react";
import styles from "./InfoCard.module.scss";
import { Icon } from "@iconify/react";

interface InfoCardProps {
  price: string;
  transactionType: string;
  status: string;
  condition: string;
  views: number;
  updatedAt: string;
  getRelativeTime: (iso: string) => string;
}

// Component hiển thị thông tin sản phẩm
const InfoCard: React.FC<InfoCardProps> = ({
  price,
  transactionType,
  status,
  condition,
  views,
  updatedAt,
  getRelativeTime,
}) => {
  // Hàm chuyển đổi transaction_type sang tiếng Việt
  const getTypeLabel = (type: string) => {
    if (type === "give away") return "Miễn phí";
    if (type === "trade" || type === "exchange") return "Trao đổi";
    if (type === "sell") return "Bán";
    return "Khác";
  };
  // Hàm chuyển đổi condition sang tiếng Việt
  const getConditionLabel = (cond: string) => {
    if (cond === "new") return "Mới ";
    if (cond === "like new") return "Gần như mới";
    if (cond === "used") return "Đã sử dụng";
    if (cond === "minor flow") return "Hư nhẹ";
    if (cond === "for repair") return "Cần sửa chữa";
    if (cond === "not working") return "Không hoạt động";
    return "Khác";
  };
  return (
    <div className={styles["info-card"]}>
      <div className={styles["price-row"]}>
        <div id="post-price" className={styles["price"]}>
          {getTypeLabel(transactionType) === "Miễn phí"
            ? "Miễn phí"
            : getTypeLabel(transactionType) === "Trao đổi"
              ? "Trao đổi"
              : price}
        </div>
        <div id="post-status" className={styles["status-badge"]}>
          {status === "active" ? "Đang Bán" : "Đã Bán"}
        </div>
      </div>
      <div className={styles["meta-grid"]}>
        <div className={styles["meta-item"]}>
          <Icon icon="lucide:repeat" width={14} height={14} />
          &nbsp;<strong>Hình thức:</strong>&nbsp;
          <span id="post-type">{getTypeLabel(transactionType)}</span>
        </div>
        <div className={styles["meta-item"]}>
          <Icon icon="lucide:package" width={14} height={14} />
          &nbsp;<strong>Tình trạng:</strong>&nbsp;
          <span id="post-condition">{getConditionLabel(condition)}</span>
        </div>

        <div className={styles["meta-item"]}>
          <Icon icon="lucide:clock" width={14} height={14} />
          &nbsp;<strong>Đăng lúc:</strong>&nbsp;
          <span id="post-created-at">{getRelativeTime(updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
