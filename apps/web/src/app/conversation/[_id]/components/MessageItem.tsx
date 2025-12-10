import React from "react";
import styles from "./MessageItem.module.scss";
import { formatImageUrl } from "@/lib/constants";

// Hiển thị 1 tin nhắn, có avatar, nội dung, ảnh, thời gian
const MessageItem = ({ message, isOwn }: { message: any; isOwn: boolean }) => {
  // Xử lý avatar người gửi
  let senderAvatar: string = "/default-avatar.png";
  if (message.senderAvatar) {
    const url = formatImageUrl(message.senderAvatar);
    if (url) senderAvatar = url;
  }
  // Không render avatar và bubble cho message hệ thống (system)
  if (message.type === "system") return null;
  return (
    <div className={isOwn ? styles.ownMessage : styles.message}>
      <div className={styles.avatar}>
        <img src={senderAvatar} alt="avatar" />
      </div>
      <div className={styles.contentBox}>
        {/* Bỏ tên người gửi */}
        {message.type === "text" && (
          <div className={styles.text}>{message.text}</div>
        )}
        {/* Hiển thị ảnh + text nếu có */}
        {message.type === "image" && message.attachments && (
          <>
            <div className={styles.images}>
              {message.attachments.map((url: string, idx: number) => {
                const imgUrl = url ? formatImageUrl(url) : "";
                return (
                  <img
                    key={idx}
                    src={imgUrl || "/default-image.png"}
                    alt="attachment"
                    className={styles.image}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/default-image.png";
                    }}
                  />
                );
              })}
            </div>
            {message.text && <div className={styles.text}>{message.text}</div>}
          </>
        )}
        {/* Hiển thị video + text nếu có */}
        {message.type === "video" && message.attachments && (
          <>
            <div className={styles.images}>
              {message.attachments.map((url: string, idx: number) => {
                const videoUrl = url ? formatImageUrl(url) : null;
                return videoUrl ? (
                  <video
                    key={idx}
                    src={videoUrl}
                    controls
                    className={`${styles.image} ${styles.videoMessage}`}
                  />
                ) : null;
              })}
            </div>
            {message.text && <div className={styles.text}>{message.text}</div>}
          </>
        )}
        <div className={styles.time}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
