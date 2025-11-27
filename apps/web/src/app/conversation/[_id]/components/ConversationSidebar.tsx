"use client";
import React, { useState } from "react";
import styles from "./ConversationSidebar.module.scss";

// Interface cho hội thoại
interface Conversation {
  _id: string;
  name: string;
  avatarUrl?: string;
  last_message?: {
    text?: string;
    created_at?: string;
    type?: string;
  };
  unreadCount: number;
  isOnline?: boolean; // Thêm trạng thái online
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
}

// Hàm format thời gian last message (ví dụ: "2 phút trước")
function timeAgo(dateString: string) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
}) => {
  const [search, setSearch] = useState<string>("");
  // Lọc hội thoại: chỉ hiển thị hội thoại đã có tin nhắn (có last_message)
  const filtered = conversations
    .filter((c: Conversation) => c.last_message)
    .filter((c: Conversation) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>Hộp thoại</div>
      {/* Ô tìm kiếm hội thoại */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Tìm kiếm hội thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ul className={styles.conversationList}>
        {filtered.length === 0 && (
          <li className={styles.empty}>Không tìm thấy hội thoại</li>
        )}
        {filtered.map((conv: Conversation) => {
          const isActive = conv._id === currentConversationId;
          // Sử dụng trạng thái online thực tế từ props
          const isOnline = !!conv.isOnline;
          return (
            <li
              key={conv._id}
              className={isActive ? styles.active : ""}
              onClick={() => onSelectConversation(conv._id)}
            >
              <div className={styles.avatarBox}>
                <div
                  className={
                    styles.avatar + (isActive ? " " + styles.avatarActive : "")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={conv.avatarUrl || "/default-avatar.png"}
                    alt="avatar"
                  />
                  {/* Dot trạng thái online/offline */}
                  <span
                    className={isOnline ? styles.onlineDot : styles.offlineDot}
                  ></span>
                </div>
              </div>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>{conv.name}</span>
                  <span className={styles.time}>
                    {timeAgo(conv.last_message?.created_at || "")}
                  </span>
                </div>
                <div className={styles.lastMessage}>
                  {/* Nếu là video thì hiển thị [Video], nếu là image thì [Ảnh], còn lại hiển thị text */}
                  {conv.last_message?.type === "video"
                    ? "[Video]"
                    : conv.last_message?.type === "image"
                      ? "[Ảnh]"
                      : conv.last_message?.text || ""}
                </div>
              </div>
              {conv.unreadCount > 0 && (
                <span className={styles.unreadBadge}>{conv.unreadCount}</span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default ConversationSidebar;
