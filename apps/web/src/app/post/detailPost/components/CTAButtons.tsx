import React from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import styles from "./CTAButtons.module.scss";

interface CTAButtonsProps {
  postId: string;
  postTitle: string;
  transactionType: string;
  status: string;
  isAuthor: boolean;
  isFavorite: boolean;
  onToggleFavorite: (postId: string) => void;
  onCreateConversation: () => void;
  createRipple: (e: React.MouseEvent, btn?: HTMLElement) => void;
  postData: any;
}

const CTAButtons: React.FC<CTAButtonsProps> = ({
  postId,
  postTitle,
  transactionType,
  status,
  isAuthor,
  isFavorite,
  onToggleFavorite,
  onCreateConversation,
  createRipple,
  postData,
}) => {
  const router = useRouter();

  const badgeClassFor = (postType: string) => {
    switch (postType) {
      case "sell":
        return styles["post-badge-ban"];
      case "exchange":
        return styles["post-badge-trao"];
      case "give away":
        return styles["post-badge-tang"];
      default:
        return "";
    }
  };

  const setTransactionType = (type: string) => {
    switch (type) {
      case "sell":
        return " Mua Ngay";
      case "give away":
        return "Nhận Miễn Phí";
      case "exchange":
        return "Đổi Sản Phẩm";
      default:
        return type;
    }
  };

  const setTransactionIcon = (type: string) => {
    switch (type) {
      case "sell":
        return "icon-park-outline:buy";
      case "give away":
        return "mdi:gift-outline";
      case "exchange":
        return "mdi:briefcase-exchange-outline";
      default:
        return type;
    }
  };

  const handleTransactionClick = (e: React.MouseEvent) => {
    createRipple(e as any);
    // Xử lý theo loại giao dịch
    if (transactionType === "sell") {
      // Validate post data trước khi lưu
      if (!postId || !postTitle) {
        console.error("❌ Invalid post data:", postData);
        alert("Dữ liệu sản phẩm không hợp lệ. Vui lòng tải lại trang.");
        return;
      }

      router.push(`/payment?postId=${postId}`);
    } else if (transactionType === "exchange") {
      // Nếu là trao đổi -> mở chat
      onCreateConversation();
    } else if (transactionType === "give away") {
      // Nếu là cho tặng -> mở chat
      onCreateConversation();
    }
  };

  if (isAuthor) {
    return <div className={`${styles["cta-box"]}`}></div>;
  }

  return (
    <div
      className={
        status === "active"
          ? `${styles["cta-box"]}`
          : `${styles["cta-box"]} ${styles["unClick"]}`
      }
    >
      <button
        type="button"
        className={`${styles["post-type-badge"]} ${styles["ripple-target"]} ${badgeClassFor(transactionType)}`}
        onClick={handleTransactionClick}
      >
        <Icon
          icon={setTransactionIcon(transactionType)}
          width={18}
          height={18}
        />
        &nbsp; {setTransactionType(transactionType)}
      </button>
      <button
        type="button"
        className={`${styles["chat-btn"]} ${styles["ripple-target"]}`}
        onClick={(e) => {
          createRipple(e as any);
          onCreateConversation();
        }}
      >
        <Icon icon="lucide:message-square" width={16} height={16} />
        &nbsp; Chat Ngay / Liên Hệ
      </button>
      <button
        type="button"
        className={`${styles["fav-btn"]} ${isFavorite ? styles["active"] : ""} ${styles["ripple-target"]}`}
        onClick={(e) => {
          createRipple(e as any);
          onToggleFavorite(postId);
        }}
      >
        <Icon icon="lucide:heart" width={16} height={16} />
        &nbsp; {isFavorite ? "Đã Lưu Yêu Thích" : "Lưu Yêu Thích"}
      </button>
    </div>
  );
};

export default CTAButtons;
