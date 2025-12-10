"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import ConversationSidebar from "./components/ConversationSidebar";

// Hàm tính tổng số tin nhắn chưa đọc và đồng bộ localStorage + event
const syncTotalUnread = (convs: any[]) => {
  const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  localStorage.setItem("totalUnread", String(total));
  // Dispatch custom event để Header và các tab khác cập nhật ngay
  window.dispatchEvent(new Event("unread-message-updated"));
};
import ConversationHeader from "./components/ConversationHeader";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import ConversationSkeleton from "./components/ConversationSkeleton";
import styles from "./conversation.module.scss";
import { formatImageUrl } from "@/lib/constants";
import { API_BASE } from "@/lib/constants";

// Interface dữ liệu hội thoại
interface IConversation {
  _id: string;
  participants: {
    _id: string;
    full_name: string;
    avatar?: string;
  }[];
  last_message?: {
    text?: string; // Text có thể optional vì message có thể chỉ có ảnh/video
    sender_id?: {
      _id: string;
      full_name: string;
      avatar?: string; // Avatar cũng optional
    };
    created_at: string;
  };
  post_id: any;
  conversation_key: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

// Interface dữ liệu tin nhắn
interface IMessage {
  _id: string;
  conversation_id: string;
  sender_id: {
    _id: string;
    full_name: string;
    avatar?: string;
  };
  type: "text" | "image" | "file" | "video";
  text?: string;
  attachments: string[];
  read_by: string[];
  created_at: string;
}

// Interface cho event conversation updated từ socket
interface IConversationUpdated {
  conversationId: string;
  last_Message: string;
  sender_id: string;
  sender_full_name?: string;
  sender_avatar?: string;
  createdAt: string;
  type: string;
}

// Interface cho event user typing từ socket
interface IUserTyping {
  conversationId: string;
  userId: string;
  full_name: string;
}

// Interface cho event user online/offline
interface IUserOnlineStatus {
  userId: string;
}

// Interface cho danh sách users online
interface IOnlineUsersList {
  userIds: string[];
}

// Interface cho online users trong conversation
interface IConversationOnlineUsers {
  conversationId: string;
  userIds: string[];
}

// Interface cho data gửi tin nhắn
interface ISendMessageData {
  text: string;
  images?: File[];
  videos?: File[];
}

// Component chính quản lý toàn bộ UI/logic hội thoại

// Component chính quản lý toàn bộ UI/logic hội thoại
// Tích hợp realtime online/offline cho user và hội thoại
export default function ChatPage() {
  // State quản lý dữ liệu
  // State lưu danh sách userId đang online toàn hệ thống
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  // State lưu danh sách userId online trong hội thoại hiện tại
  const [onlineInConversation, setOnlineInConversation] = useState<string[]>(
    []
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversation, setConversation] = useState<IConversation | null>(null);
  const [conversationsData, setConversationsData] = useState<IConversation[]>(
    []
  );
  const [messagesData, setMessagesData] = useState<IMessage[]>([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | File | null>(
    null
  );
  // State lưu thông tin post liên quan đến hội thoại (nếu có)
  const [currentPost, setCurrentPost] = useState<any>(null);
  // const [previewImage, setPreviewImage] = useState<string | null>(null); // Không dùng nữa
  const [socket, setSocket] = useState<Socket | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // State điều khiển hiển thị sidebar/chat area cho responsive
  const [showSidebar, setShowSidebar] = useState(true); // true: hiển thị sidebar, false: hiển thị chat

  // Lắng nghe resize để tự động chuyển đổi giao diện
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900) {
        // Trên mobile/tablet: chỉ hiển thị sidebar khi chưa chọn hội thoại
        setShowSidebar(!conversation);
      } else {
        // Desktop: luôn hiển thị cả 2
        setShowSidebar(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
    //
  }, [conversation]);

  // Lấy user từ localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  // Lấy danh sách conversation
  useEffect(() => {
    async function fetchConversations() {
      const userStr = localStorage.getItem("user");
      let user;
      if (userStr) user = JSON.parse(userStr);
      if (!user?._id) return;
      const res = await axios.get(
        `${API_BASE}/api/conversations/conversations/${user._id}`
      );
      setConversationsData(res.data);
      syncTotalUnread(res.data);
    }
    fetchConversations();
  }, []);

  // Lấy conversation hiện tại từ localStorage (nếu có)
  useEffect(() => {
    const conversation = localStorage.getItem("conversation");
    if (conversation) setConversation(JSON.parse(conversation));
    // Lấy post info từ localStorage nếu có (khi vừa chuyển từ DetailPost sang)
    const postInfo = localStorage.getItem("chat_post_info");
    if (postInfo) {
      try {
        setCurrentPost(JSON.parse(postInfo));
      } catch {}
      // Xóa luôn để tránh lặp lại khi chuyển hội thoại khác
      localStorage.removeItem("chat_post_info");
    }
  }, []);

  // Lấy messages của conversation hiện tại
  useEffect(() => {
    async function fetchMessages() {
      if (!conversation?._id) return;
      try {
        const res = await axios.get(
          `${API_BASE}/api/messages/conversationId/${conversation._id}`
        );
        setMessagesData(res.data);
      } catch (error) {
        // Log lỗi lấy tin nhắn
        console.error("Error fetching messages:", error);
      }
    }
    fetchMessages();
  }, [conversation?._id]);

  // Kết nối socket
  useEffect(() => {
    const newSocket = io(`${API_BASE}`, {
      transports: ["websocket"],
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Lắng nghe socket events: message, typing, online/offline, danh sách online, online trong hội thoại
  useEffect(() => {
    if (!socket || !conversation?._id || !currentUser?._id) return;
    // Tham gia room hội thoại và user (truyền userId cho join_conversation)
    socket.emit("join_conversation", {
      conversationId: conversation._id,
      userId: currentUser._id,
    });
    socket.emit("join_user", { userId: currentUser._id });

    // Nhận tin nhắn mới trong hội thoại đang mở
    const handleReceiveMessage = (msg: IMessage) => {
      // Nếu tin nhắn đến từ hội thoại đang mở, thêm vào messagesData (không tăng unread)
      if (msg.conversation_id === conversation?._id) {
        setMessagesData((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
        );
      }
      // Luôn cập nhật last_message cho sidebar (mọi hội thoại)
      // Nếu là hội thoại đang mở: unreadCount = 0
      // Nếu là hội thoại khác: tăng unreadCount lên 1
      setConversationsData((prev) =>
        prev.map((c) => {
          if (c._id === msg.conversation_id) {
            // Nếu hội thoại này đang mở thì reset unreadCount về 0
            if (c._id === conversation?._id) {
              return { ...c, last_message: msg, unreadCount: 0 };
            } else {
              // Nếu là hội thoại khác thì tăng unreadCount
              return {
                ...c,
                last_message: msg,
                unreadCount: (c.unreadCount || 0) + 1,
              };
            }
          }
          return c;
        })
      );
    };

    // Nhận event cập nhật hội thoại (last_message) từ socket (dành cho sidebar)
    const handleConversationUpdated = (data: IConversationUpdated) => {
      setConversationsData((prev) =>
        prev.map((c) =>
          c._id === data.conversationId
            ? {
                ...c,
                last_message: {
                  text: data.last_Message,
                  sender_id: {
                    _id: data.sender_id,
                    full_name: data.sender_full_name || "",
                    avatar: data.sender_avatar,
                  },
                  created_at: data.createdAt,
                  type: data.type,
                } as IConversation["last_message"],
              }
            : c
        )
      );
    };
    // Lắng nghe user typing
    const handleUserTyping = (data: IUserTyping) => {
      // TODO: Hiển thị trạng thái "đang nhập..." nếu cần
    };
    // Lắng nghe user online/offline toàn hệ thống
    const handleUserOnline = (data: IUserOnlineStatus) => {
      setOnlineUserIds((prev) => Array.from(new Set([...prev, data.userId])));
    };
    const handleUserOffline = (data: IUserOnlineStatus) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== data.userId));
    };
    // Nhận danh sách user đang online toàn hệ thống
    const handleOnlineUsers = (data: IOnlineUsersList) => {
      setOnlineUserIds(data.userIds || []);
    };
    // Nhận danh sách user online trong hội thoại hiện tại
    const handleConversationOnlineUsers = (data: IConversationOnlineUsers) => {
      if (data.conversationId === conversation._id) {
        setOnlineInConversation(data.userIds || []);
      }
    };
    // Lắng nghe reconnect
    const handleReconnect = () => {
      socket.emit("join_conversation", {
        conversationId: conversation._id,
        userId: currentUser._id,
      });
      socket.emit("join_user", { userId: currentUser._id });
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("online_users", handleOnlineUsers);
    socket.on("conversation_online_users", handleConversationOnlineUsers);
    socket.on("reconnect", handleReconnect);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("online_users", handleOnlineUsers);
      socket.off("conversation_online_users", handleConversationOnlineUsers);
      socket.off("reconnect", handleReconnect);
    };
  }, [socket, conversation?._id, currentUser?._id]);

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (endRef.current)
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messagesData]);

  // Đổi hội thoại: khi mở hội thoại thì set unreadCount = 0, đồng bộ lại tổng unread
  const handleChangeConversation = async (_id: string) => {
    const selected = conversationsData.find((c) => c._id === _id);
    if (selected && currentUser?._id) {
      setConversation(selected);
      localStorage.setItem("conversation", JSON.stringify(selected));
      // Gọi API mark-as-read để lưu trạng thái đã đọc trên database
      try {
        await axios.patch(`${API_BASE}/api/messages/mark-as-read/${_id}`, {
          userId: currentUser._id,
        });
        // Sau khi đánh dấu đã đọc, fetch lại messages để cập nhật trạng thái
        const res = await axios.get(
          `${API_BASE}/api/messages/conversationId/${_id}`
        );
        setMessagesData(res.data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Lỗi mark-as-read:", err);
      }
      // Đặt unreadCount = 0 cho hội thoại này
      setConversationsData((prev) =>
        prev.map((c) => (c._id === _id ? { ...c, unreadCount: 0 } : c))
      );
      if (window.innerWidth < 900) {
        setShowSidebar(false);
      }
    }
  };
  // Khi conversationsData thay đổi, đồng bộ lại tổng unread (phòng trường hợp cập nhật từ socket hoặc fetch lại)
  useEffect(() => {
    syncTotalUnread(conversationsData);
  }, [conversationsData]);

  // Quay lại sidebar trên mobile/tablet
  const handleBackSidebar = () => {
    setShowSidebar(true);
  };

  // Gửi tin nhắn (text + nhiều ảnh + video)
  // Chỉ cập nhật tin nhắn khi nhận qua socket, không tự push sau khi gửi API
  const handleSendMessage = async ({
    text,
    images = [],
    videos = [],
  }: ISendMessageData) => {
    if ((!text || !text.trim()) && images.length === 0 && videos.length === 0)
      return;
    if (!conversation?._id || !currentUser?._id) return;
    let attachments: string[] = [];
    let type: "text" | "image" | "video" = "text";

    // Upload tất cả video trước (nếu có)
    if (videos && videos.length > 0) {
      try {
        const uploadPromises = videos.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("bucket", "conversation/videos");
          return axios.post(`${API_BASE}/api/upload/video`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        });
        const results = await Promise.all(uploadPromises);
        attachments = attachments.concat(
          results.map((res) => res.data.filename)
        );
        type = "video";
      } catch (err) {
        alert("Lỗi upload video. Vui lòng thử lại!");
        return;
      }
    }
    // Upload tất cả ảnh (nếu có)
    if (images && images.length > 0) {
      try {
        const uploadPromises = images.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("bucket", "conversation");
          return axios.post(`${API_BASE}/api/upload/img`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        });
        const results = await Promise.all(uploadPromises);
        attachments = attachments.concat(
          results.map((res) => res.data.filename)
        );
        if (type !== "video") type = "image";
      } catch (err) {
        alert("Lỗi upload ảnh. Vui lòng thử lại!");
        return;
      }
    }
    // Gửi message với text và attachments (có thể cả ảnh + video + text)
    const payload = {
      conversation_id: conversation._id,
      sender_id: currentUser._id,
      type: attachments.length > 0 ? type : "text",
      text: text || "",
      attachments,
    };
    try {
      const res = await axios.post(`${API_BASE}/api/messages`, payload);
      if (socket) {
        socket.emit("send_message", {
          conversationId: conversation._id,
          receiverId: conversation.participants.find(
            (p) => p._id !== currentUser._id
          )?._id,
          ...res.data,
        });
      }
      // KHÔNG setMessagesData ở đây, chỉ cập nhật khi nhận receive_message qua socket
    } catch (err) {
      alert("Gửi tin nhắn thất bại. Vui lòng thử lại!");
    }
  };

  // Upload ảnh
  const uploadImage = async (file: File, bucket = "conversation") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    const res = await axios.post(`${API_BASE}/api/upload/img`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.filename;
  };

  // Loading skeleton nếu chưa có dữ liệu user hoặc conversations
  if (!currentUser || conversationsData.length === 0) {
    return <ConversationSkeleton />;
  }

  // Lấy user còn lại trong cuộc trò chuyện (không phải currentUser)
  const otherUser = conversation?.participants.find(
    (p) => p._id !== currentUser?._id
  );
  // Trạng thái online của user còn lại (dựa vào onlineUserIds hoặc onlineInConversation)
  const isOtherUserOnline = otherUser
    ? onlineUserIds.includes(otherUser._id)
    : false;

  // Responsive layout: mobile/tablet chỉ hiển thị sidebar hoặc chat area
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          conversations={[...conversationsData]
            .sort((a, b) => {
              // Sắp xếp theo last_message.created_at giảm dần
              const aTime = a.last_message?.created_at
                ? new Date(a.last_message.created_at).getTime()
                : 0;
              const bTime = b.last_message?.created_at
                ? new Date(b.last_message.created_at).getTime()
                : 0;
              return bTime - aTime;
            })
            .map((conv) => {
              const other = conv.participants.find(
                (p) => p._id !== currentUser._id
              );
              let lastMessageType = undefined;
              if (conv.last_message) {
                if ((conv as any).last_message?.type) {
                  lastMessageType = (conv as any).last_message.type;
                } else {
                  const text = conv.last_message.text || "";
                  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                    text
                  );
                  if (isImage) lastMessageType = "image";
                }
              }
              // Trạng thái online của user còn lại trong hội thoại
              const isOnline = other
                ? onlineUserIds.includes(other._id)
                : false;
              return {
                _id: conv._id,
                name: other ? other.full_name : "Nhóm",
                avatarUrl:
                  other && other.avatar
                    ? formatImageUrl(other.avatar) || "/default-avatar.png"
                    : "/default-avatar.png",
                last_message: conv.last_message
                  ? {
                      text: conv.last_message.text,
                      created_at: conv.last_message.created_at,
                      type: lastMessageType,
                    }
                  : undefined,
                unreadCount: conv.unreadCount || 0,
                isOnline,
              };
            })}
          currentConversationId={conversation?._id || ""}
          onSelectConversation={handleChangeConversation}
        />
      )}

      {/* Chat area */}
      {!showSidebar && conversation && (
        <main className={styles.chatArea}>
          {/* Header tích hợp nút back */}
          {otherUser && (
            <ConversationHeader
              user={{
                name: otherUser.full_name,
                avatarUrl: otherUser.avatar
                  ? formatImageUrl(otherUser.avatar) || "/default-avatar.png"
                  : "/default-avatar.png",
              }}
              status={isOtherUserOnline ? "online" : "offline"}
              onBack={handleBackSidebar}
              isShowBack={true}
            />
          )}
          {/* Messages */}
          <MessageList
            messages={messagesData.map((msg) => {
              let attachments = msg.attachments;
              let text = msg.text;
              if (msg.type === "image") {
                if ((!attachments || attachments.length === 0) && text) {
                  attachments = [text];
                  text = undefined;
                }
              }
              return {
                _id: msg._id,
                sender_id: msg.sender_id._id,
                senderName: msg.sender_id.full_name,
                senderAvatar: msg.sender_id.avatar
                  ? formatImageUrl(msg.sender_id.avatar)
                  : undefined,
                type: msg.type,
                text,
                attachments,
                created_at: msg.created_at,
              };
            })}
            currentUserId={currentUser._id}
            currentPost={currentPost}
            sellerId={
              conversation?.participants.find((p) => p._id !== currentUser._id)
                ?._id
            }
          />
          <div ref={endRef} />
          <MessageInput onSend={handleSendMessage} loading={false} />
        </main>
      )}
      {/* Desktop: luôn hiển thị cả 2 */}
      {window.innerWidth >= 900 && conversation && (
        <main className={styles.chatArea}>
          {/* Header */}
          {otherUser && (
            <ConversationHeader
              user={{
                name: otherUser.full_name,
                avatarUrl: otherUser.avatar
                  ? formatImageUrl(otherUser.avatar) || "/default-avatar.png"
                  : "/default-avatar.png",
              }}
              status={isOtherUserOnline ? "online" : "offline"}
            />
          )}
          {/* Messages */}
          <MessageList
            messages={messagesData.map((msg) => {
              let attachments = msg.attachments;
              let text = msg.text;
              if (msg.type === "image") {
                if ((!attachments || attachments.length === 0) && text) {
                  attachments = [text];
                  text = undefined;
                }
              }
              return {
                _id: msg._id,
                sender_id: msg.sender_id._id,
                senderName: msg.sender_id.full_name,
                senderAvatar: msg.sender_id.avatar
                  ? formatImageUrl(msg.sender_id.avatar)
                  : undefined,
                type: msg.type,
                text,
                attachments,
                created_at: msg.created_at,
              };
            })}
            currentUserId={currentUser._id}
            currentPost={currentPost}
            sellerId={
              conversation?.participants.find((p) => p._id !== currentUser._id)
                ?._id
            }
          />
          <div ref={endRef} />
          <MessageInput onSend={handleSendMessage} loading={false} />
        </main>
      )}
    </div>
  );
}
