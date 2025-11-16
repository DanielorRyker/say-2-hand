import React from "react";
import { useRouter } from "next/navigation";
import styles from "./MobileFooter.module.scss";

interface MobileFooterProps {
  postId: string;
  postTitle: string;
  transactionType: string;
  isFavorite: boolean;
  onToggleFavorite: (postId: string) => void;
  onCreateConversation: () => void;
  postData: any;
}

const MobileFooter: React.FC<MobileFooterProps> = ({
  postId,
  postTitle,
  transactionType,
  isFavorite,
  onToggleFavorite,
  onCreateConversation,
  postData,
}) => {
  const router = useRouter();

  const handleMainAction = () => {
    // Xử lý theo loại giao dịch
    if (transactionType === "sell") {
      // Validate post data trước khi lưu
      if (!postId || !postTitle) {
        console.error("❌ Invalid post data (mobile):", postData);
        alert("Dữ liệu sản phẩm không hợp lệ. Vui lòng tải lại trang.");
        return;
      }

      // Lưu dữ liệu vào sessionStorage trước khi navigate
      try {
        const dataToStore = {
          _id: postId,
          post_id: postId,
          title: postTitle,
          price: postData.post.price,
          condition: postData.post.condition,
          transaction_type: postData.post.transaction_type,
          images: postData.post.image_urls,
          location: postData.location,
          author_id: postData.user,
        };
        sessionStorage.setItem(
          `selectedPost_${postId}`,
          JSON.stringify(dataToStore)
        );
        console.log("✅ Saved post data to sessionStorage (mobile):", {
          postId: postId,
          title: postTitle,
          hasImages: dataToStore.images?.length > 0,
        });
      } catch (err) {
        console.error("❌ Error saving to sessionStorage (mobile):", err);
        // Không block navigation
      }
      // Chuyển đến trang thanh toán
      router.push(`/payment?postId=${postId}`);
    } else {
      // Nếu là trao đổi hoặc cho tặng -> mở chat
      onCreateConversation();
    }
  };

  return (
    <div className={`${styles["mobile-footer"]}`}>
      <div className={`${styles["mobile-footer-inner"]}`}>
        <button
          type="button"
          className={`${styles["fav-btn"]} ${isFavorite ? `${styles["active"]}` : ""}`}
          onClick={() => onToggleFavorite(postId)}
          aria-label="Lưu yêu thích"
        >
          {isFavorite ? "Đã Lưu" : "Lưu"}
        </button>
        <button
          type="button"
          className={`${styles["chat-btn"]}`}
          onClick={handleMainAction}
        >
          {transactionType === "sell" ? "Mua Ngay" : "Chat Ngay"}
        </button>
      </div>
    </div>
  );
};

export default MobileFooter;
