// CTAArea.tsx - Component hiển thị các nút CTA (mua, chat, lưu yêu thích)
import React from "react";
import styles from "./CTAArea.module.scss";
import { Icon } from "@iconify/react";

interface CTAAreaProps {
  post: any;
  currentUser: any;
  isFavorite: boolean;
  badgeClassFor: (type: string) => string;
  setTransactionIcon: (type: string) => string;
  setTransactionType: (type: string) => string;
  createRipple: (e: React.MouseEvent | MouseEvent) => void;
  handleCreateConversation: () => void;
  toggleFavorite: (postId: string) => void;
  router: any;
}

// Component hiển thị các nút CTA
const CTAArea: React.FC<CTAAreaProps> = ({
  post,
  currentUser,
  isFavorite,
  badgeClassFor,
  setTransactionIcon,
  setTransactionType,
  createRipple,
  handleCreateConversation,
  toggleFavorite,
  router,
}) => {
  return (
    <div
      className={
        post?.status === "active"
          ? styles["cta-box"]
          : `${styles["cta-box"]} ${styles["unClick"]}`
      }
    >
      {post.author_id !== currentUser?._id ? (
        <>
          <button
            type="button"
            className={`${styles["post-type-badge"]} ${styles["ripple-target"]} ${badgeClassFor(post.transaction_type)}`}
            onClick={(e) => {
              createRipple(e as any);
              if (post.transaction_type === "sell") {
                if (!post._id || !post.title) {
                  alert(
                    "Dữ liệu sản phẩm không hợp lệ. Vui lòng tải lại trang."
                  );
                  return;
                }
                router.push(`/payment?postId=${post._id}`);
              } else if (
                post.transaction_type === "exchange" ||
                post.transaction_type === "give away"
              ) {
                handleCreateConversation();
              }
            }}
          >
            <Icon
              icon={setTransactionIcon(post.transaction_type)}
              width={18}
              height={18}
            />
            &nbsp; {setTransactionType(post.transaction_type)}
          </button>
          <button
            type="button"
            className={`${styles["chat-btn"]} ${styles["ripple-target"]}`}
            onClick={(e) => {
              createRipple(e as any);
              handleCreateConversation();
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
              toggleFavorite(post._id!);
            }}
          >
            <Icon icon="lucide:heart" width={16} height={16} />
            &nbsp; {isFavorite ? "Đã Lưu Yêu Thích" : "Lưu Yêu Thích"}
          </button>
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default CTAArea;
