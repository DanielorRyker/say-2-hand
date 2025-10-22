"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle } from "lucide-react";
import axios from "axios";
import styles from "./notification.module.scss"; 

type Notification = {
  _id: string;
  title: string;
  body: string;
  type: string;
  deeplink?: string;
  is_read: boolean;
  createdAt: string;
};

export default function NotificationPopup() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);

  // 🧍 Lấy user hiện tại
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  // 📥 Gọi API lấy thông báo
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?._id) return;
      try {
        const res = await axios.get(
          `http://localhost:8080/api/notifications/user/${currentUser._id}`
        );
        setNotifications(res.data);
      } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
      }
    };
    fetchNotifications();
  }, [currentUser]);

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

  // ✅ Đánh dấu là đã đọc
  // const markAsRead = async (id: string, deeplink?: string) => {
  //   try {
  //     await axios.patch(`/api/notifications/${id}`, { is_read: true });
  //     setNotifications((prev) =>
  //       prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
  //     );
  //     if (deeplink) window.location.href = deeplink.replace("app://", "/");
  //   } catch (error) {
  //     console.error("Không thể cập nhật thông báo:", error);
  //   }
  // };

  return (
    <div className={styles.container} ref={popupRef}>
      {/* Icon chuông */}
      <button onClick={() => setOpen(!open)} className={styles.bellButton}>
        <Bell className={styles.bellIcon} />
        {notifications.some((n) => !n.is_read) && (
          <span className={styles.unreadDot} />
        )}
      </button>

      {/* Popup */}
      {open && (
        <div className={styles.popup}>
          <div className={styles.header}>Thông báo</div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>Không có thông báo nào</div>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n) => (
                <li
                  key={n._id}
                  // onClick={() => markAsRead(n._id, n.deeplink)}
                  className={styles.item}
                >
                  <div className={styles.itemContent}>                  
                    <div className={styles.itemTextContent}>
                      <div className={styles.title}>{n.title}</div>
                      <div className={styles.body}>{n.body}</div>
                      <div className={styles.time}>{getRelativeTime(n.createdAt)}</div>
                    </div>

                     <div className={styles.itemButtonContent}>
                      
                    </div>
                    {/* {n.is_read && (
                      <CheckCircle className={styles.readIcon} />
                    )} */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
