"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle } from "lucide-react";
import axios from "axios";
import styles from "./notification.module.scss";
import headerStyles from "@/app/layouts/header.module.scss";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

type RelatedPost = {
  _id: string;
  author_id: string;
  category_id: string;
  title: string;
  description: string;
  images: {
    _id: string;
    url: string;
    alt?: string;
    tags: string[];
  }[];
};

type RelatedTransaction = {
  _id: string;
  post_id: RelatedPost;
  seller_id: string;
  buyer_id: string;
  amount: number;
  currency: string;
  payment_gateway: string;
  payment_method: string;
  payment_status: string;
  transaction_ref: string;
  status: string;
};

type Notification = {
  _id: string;
  title: string;
  body: string;
  type: string;
  deeplink?: string;
  is_read: boolean;
  createdAt: string;
  sender_id: {
    _id: string;
    full_name: string;
    avatar: string;
  };
  related_model?: string;
  related_id?: RelatedPost | RelatedTransaction ;
};

export default function NotificationPopup() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🧍 Lấy user hiện tại
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  // 📥 Gọi API lấy thông báo
  const fetchNotifications = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await axios.get(
        `http://localhost:8080/api/notifications/user/${currentUser._id}`
      );
      setNotifications(res.data);

      const unread = res.data.filter(
        (n: { is_read: any }) => !n.is_read
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchNotifications();
    }
  }, [currentUser?._id]);

  // 🔔 Ẩn popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  ////Tính thời gian
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

  //Socket
  
  const [socket, setSocket] = useState<Socket | null>(null);
  // useEffect(() => {
  //   // Kết nối socket.io tới BE (NestJS WebSocketGateway)
  //   const newSocket = io("http://localhost:8080", {
  //     transports: ["websocket"],
  //   });

  //   setSocket(newSocket);

  //   newSocket.on("connect", () => {
  //     console.log("Connected to socket:", newSocket.id);
  //   });

  //   newSocket.on("disconnect", () => {
  //     console.log("Disconnected from socket");
  //   });

  //   // cleanup khi unmount
  //   return () => {
  //     newSocket.disconnect();
  //   };
  // }, []);
  // Khởi tạo socket
useEffect(() => {
  const newSocket = io("http://localhost:8080", {
    transports: ["websocket"],
  });
  setSocket(newSocket);

  newSocket.on("connect", () => {
    console.log("Connected to socket:", newSocket.id);
  });

  newSocket.on("disconnect", () => {
    console.log("Disconnected from socket");
  });

  return () => {
    newSocket.disconnect();
  };
}, []);

// Join user khi đã có socket và user
useEffect(() => {
  if (!socket || !currentUser?._id) return;

  console.log("Joining user room:", currentUser._id);
  socket.emit("join_user", { userId: currentUser._id });

  // Optional: gửi lại khi socket reconnect
  socket.on("connect", () => {
    console.log("Reconnect detected, rejoining user room:", currentUser._id);
    socket.emit("join_user", { userId: currentUser._id });
  });

  return () => {
    socket.off("connect");
  };
}, [socket, currentUser?._id]);

  // Lắng nghe receive_message => reload API
  useEffect(() => {
    if (!socket || !currentUser?._id) return;

    socket.emit("join_user", { userId: currentUser._id });

    const handleUpdate = (data: any) => {
      console.log(" Có tin nhắn mới tới phòng khác:", data);

      fetchNotifications();
    };

    socket.on("conversation_updated", handleUpdate);

    return () => {
      socket.off("conversation_updated", handleUpdate);
    };
  }, [socket, currentUser?._id]);

  
  //Filler
  const [filter, setFilter] = useState<string | null>(null);

  const fillerNotification = async () => {
    if (!currentUser?._id) return;
    if (filter == null) {
      fetchNotifications();
    } else {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/notifications/${filter}/${currentUser._id}`
        );
        setNotifications(res.data);
      } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
      }
     
    };
  }

    useEffect(() => {
    fillerNotification(); // tự động lọc lại mỗi khi filter thay đổi
  }, [filter]);


  const handleClick = (type: string) => {
    if (filter === type) {
      // Nếu click lại cùng nút → bỏ chọn
      setFilter(null);
      console.log("Reload tất cả thông báo");
      // 👉 Gọi lại API fetchNotifications() ở đây nếu bạn muốn
    } else {
      setFilter(type);
      console.log("Lọc theo:", type);
      // 👉 Gọi API lọc thông báo ở đây
    }
  };

  const markAllAsRead = async () => {
    // chỉ chạy khi mở popup
    if (!currentUser?._id || open) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/notifications/read-all/${currentUser._id}`
      );
      fetchNotifications();
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  };
  

  return (
    <div className={styles.container} ref={popupRef}>
      {/* Icon chuông */}
      <button
        className={headerStyles.btnHeader}
        type="button"
        title="Thông báo"
        aria-label="Thông báo"
        onClick={() => {
          setOpen(!open);
          markAllAsRead();
        }}
      >
        <Image
          src="/image/header/Notification Icon.svg"
          alt="Thông báo"
          className={headerStyles.img}
          width={24}
          height={24}
        />
        {unreadCount == 0 ? (
          <div></div>
        ) : (
          <div className={styles.unreadCount}>{unreadCount}</div>
        )}
      </button>

      {open && (
        <div className={styles.popup}>
          <div className={styles.header}>Thông báo</div>
          <div className={styles.fillerContrainer}>
            <label className={styles.lbFiller}>Lọc :</label>
            <button
              className={`${styles.btnFilter} ${filter === "transaction" ? styles.active : styles.btnFilter}`}
              onClick={() => ( handleClick("transaction"))}
            >
              Giao dịch
            </button>

            <button
              className={`${styles.btnFilter} ${filter === "moderation" ? styles.active : styles.btnFilter}`}
              onClick={() => ( handleClick("moderation"))}
            >
              Tin đăng
            </button>

            <button
              className={`${styles.btnFilter} ${filter === "system" ? styles.active : styles.btnFilter}`}
              onClick={() => (handleClick("system"))}
            >
              Hệ thống
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className={styles.empty}>Không có thông báo nào</div>
          ) : (
            <div className={styles.list}>
              {notifications.map((n) => (
                <div
                  key={n._id}
                  // onClick={() => markAsRead(n._id, n.deeplink)}
                  className={styles.item}
                >
                  <div className={styles.itemContent}>
                    <img
                      src={
                        n.sender_id.avatar
                          ? process.env.NEXT_PUBLIC_URL_GCS + n.sender_id.avatar
                          : "/image/header/carbon_user-avatar-filled-alt.svg"
                      }
                      alt=""
                      className={styles.avatarImage}
                    />

                    <div className={styles.itemTextContent}>
                      <div className={styles.title}>
                        {n.title}
                        {n.is_read == false ? (
                          <div className={styles.unreadDot}></div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                      <div className={styles.body}>{n.body}</div>
                      <div className={styles.time}>
                        {getRelativeTime(n.createdAt)}
                      </div>
                    </div>
                        
                        {n.related_id  && (n.related_id as RelatedPost).images && (n.related_id as RelatedPost).images[0] ? 
                          <Image
                            src={process.env.NEXT_PUBLIC_URL_GCS + (n.related_id as RelatedPost).images[0].url}
                            alt={(n.related_id as RelatedPost).images[0].alt || ""}
                            className={styles.postImage}
                            width={48}
                            height={48}
                          />
                          :
                          n.related_id  && ((n.related_id as RelatedTransaction).post_id as RelatedPost).images?
                          
                          <Image
                            src={process.env.NEXT_PUBLIC_URL_GCS + ((n.related_id as RelatedTransaction).post_id as RelatedPost).images[0].url}
                            alt={((n.related_id as RelatedTransaction).post_id as RelatedPost).images[0].alt || ""}
                            className={styles.postImage}
                            width={48}
                            height={48}
                          />
                          :      
                          <div className={styles.postImage}></div>                   
                        }
                        
              
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

