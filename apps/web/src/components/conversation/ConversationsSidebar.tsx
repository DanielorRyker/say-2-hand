"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import headerStyles from "@/styles/layout/header.module.scss";
import cvstStyles from "@/styles/pages/conversation/conversationSidebar.module.scss";
import axios from "axios";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

export default function ConversationsSidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const userData =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userData ? JSON.parse(userData) : null;

  interface IConversation {
    _id: string;
    post_id: {
      _id: string;
      title: string;
      image: string;
    };
    participants: {
      _id: string;
      full_name: string;
      avatar?: string;
    }[];
    last_message?: {
      text: string;
      sender_id?: {
        _id: string;
        full_name: string;
        avatar: string;
      };
      created_at: string;
    };
    updatedAt: string;
  }

  const [conversationsData, setConversationsData] = useState<IConversation[]>(
    [],
  );
  const [socket, setSocket] = useState<Socket | null>(null);

  // API lấy danh sách
  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(
        `http://localhost:8080/api/conversations/conversations/${currentUser._id}`,
      );
      setConversationsData(res.data);
    } catch (err) {
      console.error("Lỗi fetch conversations:", err);
    }
  }, [currentUser]);

  // Lần đầu load
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Socket connect
  useEffect(() => {
    const newSocket = io("http://localhost:8080", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Lắng nghe receive_message => reload API
  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", () => {
      fetchPosts(); // gọi lại API để đảm bảo last_message luôn chính xác
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket, fetchPosts]);

  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    const years = Math.floor(months / 12);
    return `${years} năm trước`;
  };

  const handleMessage = (conversation: IConversation) => {
    localStorage.setItem("conversation", JSON.stringify(conversation));
    router.push(`/conversation/${conversation._id}`);
  };

  return (
    <div>
      {/* Nút mở sidebar */}
      <button
        className={headerStyles.btnHeader}
        type="button"
        title="Tin nhắn"
        aria-label="Tin nhắn"
      >
        <Image
          src="/image/header/IconMessage.svg"
          alt="Tin nhắn"
          className={headerStyles.img}
          width={24}
          height={24}
          onClick={() => setOpen(true)}
        />
      </button>

      {/* Overlay */}
      {open && (
        <div className={cvstStyles.overlay} onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${cvstStyles.sidebar} ${open ? cvstStyles.open : ""}`}>
        {/* Header */}
        <div className={cvstStyles.header}>
          <h2 className={cvstStyles.title}>Tin nhắn</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Đóng tin nhắn"
            title="Đóng"
          >
            <X className={cvstStyles.x} />
          </button>
        </div>

        {/* Danh sách conversation */}
        <div className={cvstStyles.content}>
          {conversationsData
            .filter((c) => c.last_message) 
            .map((c) => {
              const otherUser = c.participants.find(
                (p) => p._id !== currentUser?._id,
              );
            return (
              <div
                className={cvstStyles.card}
                key={c._id}
                onClick={() => handleMessage(c)}
              >
                <Image
                  src={
                    c.post_id.image
                      ? process.env.NEXT_PUBLIC_URL_GCS + c.post_id.image
                      : "/image/header/carbon_user-avatar-filled-alt.svg"
                  }
                  alt="Post"
                  className={cvstStyles.squareImage}
                  width={80}
                  height={80}
                />

                <div className={cvstStyles.contentItem}>
                  <p className={cvstStyles.titleItem}>{c.post_id.title}</p>

                  {otherUser && (
                    <div className={cvstStyles.headerItem}>
                      <Image
                        src={
                          otherUser.avatar
                            ? process.env.NEXT_PUBLIC_URL_GCS + otherUser.avatar
                            : "/image/header/carbon_user-avatar-filled-alt.svg"
                        }
                        alt="Avatar"
                        className={cvstStyles.avatar}
                        width={40}
                        height={40}
                      />
                      <span className={cvstStyles.titleName}>
                        {otherUser.full_name || "Người dùng"}
                      </span>
                    </div>
                  )}

                  <p className={cvstStyles.text}>
                    {c.last_message?.sender_id?.full_name}: &nbsp;
                    {c.last_message?.text}
                  </p>
                  <p className={cvstStyles.time}>
                    {c.last_message?.created_at
                      ? getRelativeTime(c.last_message?.created_at)
                      : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
