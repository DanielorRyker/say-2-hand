import React from "react";
import { Icon } from "@iconify/react";
import styles from "./PostInfo.module.scss";

interface PostInfoProps {
  price: string;
  transactionType: string;
  status: string;
  condition: string;
  views: number;
  createdAt: string;
  getRelativeTime: (isoString: string) => string;
}

const PostInfo: React.FC<PostInfoProps> = ({
  price,
  transactionType,
  status,
  condition,
  views,
  createdAt,
  getRelativeTime,
}) => {
  const getTransactionTypeLabel = (type: string) => {
    if (type === "give away") return "Miễn phí";
    if (type === "trade") return "Trao đổi";
    if (type === "sell") return "Bán";
    return "Khác";
  };

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
    <div className={`${styles["info-card"]}`}>
      <div className={`${styles["price-row"]}`}>
        <div id="post-price" className={`${styles["price"]}`}>
          {transactionType === "give away"
            ? "Miễn phí"
            : transactionType === "exchange"
              ? "Trao đổi"
              : price}
        </div>
        <div id="post-status" className={`${styles["status-badge"]}`}>
          {status === "active" ? "Đang Bán" : "Đã Bán"}
        </div>
      </div>

      <div className={`${styles["meta-grid"]}`}>
        <div className={`${styles["meta-item"]}`}>
          <Icon icon="lucide:repeat" width={14} height={14} />
          &nbsp;<strong>Hình thức:</strong>&nbsp;
          <span id="post-type">{getTransactionTypeLabel(transactionType)}</span>
        </div>
        <div className={`${styles["meta-item"]}`}>
          <Icon icon="lucide:package" width={14} height={14} />
          &nbsp;<strong>Tình trạng:</strong>&nbsp;
          <span id="post-condition">{getConditionLabel(condition)}</span>
        </div>
        <div className={`${styles["meta-item"]}`}>
          <Icon icon="lucide:eye" width={14} height={14} />
          &nbsp;<strong>Lượt xem:</strong>&nbsp;
          <span id="post-views">{views.toLocaleString("vi-VN")}</span>
        </div>
        <div className={`${styles["meta-item"]}`}>
          <Icon icon="lucide:clock" width={14} height={14} />
          &nbsp;<strong>Đăng lúc:</strong>&nbsp;
          <span id="post-created-at">{getRelativeTime(createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default PostInfo;
