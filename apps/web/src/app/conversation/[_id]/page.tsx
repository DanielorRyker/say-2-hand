"use client";

import { useEffect, useRef, useState } from "react";
import cvstStyles from "@/app/conversation/conversation.module.scss";
import Image from "next/image";
import axios from "@/lib/api-client";
import { formatImageUrl } from "@/lib/constants";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export default function ChatPage() {
  const router = useRouter();
  // user hiện tại

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | File | null>(
    null
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- cleanup preview
  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  interface IConversation {
    _id: string;

    // post đã populate
    post_id: {
      _id: string;
      author_id: {
        _id: string;
        full_name: string;
        avatar: string;
      };
      category_id: string;
      title: string;
      price: number;
      description: string;
      condition: "new" | "used";
      transaction_type: "sell" | "buy";
      status: "active" | "inactive";
      images: {
        _id: string;
        url: string;
        alt?: string;
        tags: string[];
      }[];
      address: string;
      createdAt: string;
      updatedAt: string;
      __v?: number;
    };

    // danh sách user tham gia
    participants: {
      _id: string;
      full_name: string;
      avatar?: string;
    }[];

    // tin nhắn cuối
    last_message?: {
      text: string;
      sender_id?: {
        _id: string;
        full_name: string;
        avatar: string;
      };
      created_at: string;
    };

    conversation_key: string;
    createdAt: string;
    updatedAt: string;
    unreadCount: number;
    __v?: number;
  }

  const [conversation, setConversation] = useState<IConversation | null>(null);
  const [conversationsData, setConversationsData] = useState<IConversation[]>(
    []
  );

  useEffect(() => {
    // chạy ở client sau khi render
    const conversation = localStorage.getItem("conversation");
    if (conversation) {
      setConversation(JSON.parse(conversation));
    }
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      const userStr = localStorage.getItem("user");
      let user;
      if (userStr) {
        user = JSON.parse(userStr); // chuyển string -> object
      }
      const res = await axios.get(
        `http://localhost:8080/api/conversations/conversations/${user._id}`
      );
      setConversationsData(res.data);
    }
    fetchPosts();
  }, []);

  const uniqueUsers = conversationsData.reduce((acc: any[], c) => {
    const otherUser = c.participants.find(
      (p: any) => p._id !== currentUser?._id
    );
    if (otherUser && !acc.find((u) => u._id === otherUser._id)) {
      acc.push(otherUser);
    }
    return acc;
  }, []);

  const otherUser = conversation?.participants.find(
    (p: any) => p._id !== currentUser?._id
  );
  //messages
  interface IMessage {
    _id: string;
    conversation_id: string;

    sender_id: {
      _id: string;
      full_name: string;
      avatar?: string;
    };

    type: "text" | "image" | "file"; // mở rộng nếu có thêm loại message khác
    text?: string;
    attachments: string[];
    read_by: string[];

    created_at: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
  }
  const [messagesData, setMessagesData] = useState<IMessage[]>([]);

  useEffect(() => {
    async function fetchPostsMessage() {
      if (!conversation?._id) return; // tránh gọi khi chưa có id

      try {
        const res = await axios.get(
          `http://localhost:8080/api/messages/conversationId/${conversation._id}`
        );
        setMessagesData(res.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }

    fetchPostsMessage();
  }, [conversation?._id]);

  const handleChangeConversation = (_id: string) => {
    const selected = conversationsData.find((c) => c._id === _id);
    if (selected) {
      setConversation(selected);

      // nếu muốn lưu vào localStorage để khi F5 không mất
      localStorage.setItem("conversation", JSON.stringify(selected));

      markConversationAsRead(selected);
    }
  };

  const [text, setText] = useState("");

  //Socket
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    // Kết nối socket.io tới BE (NestJS WebSocketGateway)
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

    // cleanup khi unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !conversation?._id || !currentUser?._id) return;

    // Join cả phòng hội thoại và phòng user
    socket.emit("join_conversation", { conversationId: conversation._id });
    socket.emit("join_user", { userId: currentUser._id });

    // Khi nhận tin nhắn trong cuộc trò chuyện đang mở
    const handleReceiveMessage = (msg: any) => {
      if (msg.conversation_id === conversation._id) {
        //Đánh dấu đã đọc
        axios.patch(
          `http://localhost:8080/api/messages/mark-as-read/${conversation._id}`,
          { userId: currentUser._id }
        );
        // ✅ Thêm vào danh sách tin nhắn hiện tại
        setMessagesData((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // ✅ Cập nhật last_message cho conversation hiện tại
        setConversationsData((prev) =>
          prev.map((c) =>
            c._id === msg.conversation_id ? { ...c, last_message: msg } : c
          )
        );
      }
    };

    // Khi có tin nhắn đến cuộc trò chuyện KHÁC (chưa join)
    const handleConversationUpdated = (data: any) => {
      setConversationsData((prev) =>
        prev.map((c) => {
          if (c._id === data.conversationId) {
            // Nếu conversation đang mở, giữ unreadCount = 0
            const unread =
              conversation?._id === data.conversationId
                ? 0
                : (c.unreadCount || 0) + (data.unreadIncrement || 1);

            return {
              ...c,
              unreadCount: unread,
              last_message: {
                text: data.text,
                created_at: data.createdAt,
                sender_id: data.sender_id,
              },
            };
          }
          return c;
        })
      );
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("conversation_updated", handleConversationUpdated);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [socket, conversation?._id, currentUser?._id]);

  /// Gửi tin nhắn

  const handleSendMessage = async () => {
    if (!text.trim() && !selectedImage) return;
    if (!conversation?._id || !currentUser?._id) return;

    try {
            //Kiểm tra postId
            try {
              const foundConversation = conversationsData.find(
                (c) => c._id === conversation?._id
              );

              if (
                foundConversation &&
                foundConversation.post_id?._id !== conversation?.post_id?._id
              ) {
                console.log("🔄 Updating conversation:", {
                  id: foundConversation._id,
                  post_id: String(conversation.post_id._id),
                });

                await axios.patch(
                  `http://localhost:8080/api/conversations/${foundConversation._id}`,
                  {
                    post_id: String(conversation.post_id._id),
                  }
                );
              }
            } catch (err: any) {
              console.error("❌ Update conversation failed:", err.response?.data || err);
            }


      let finalText = text;
      let type: "text" | "image" = "text";

      // Nếu có ảnh thì upload
      if (selectedImage && selectedImage instanceof File) {
        const filename = await uploadImage(selectedImage);
        finalText = filename; // BE trả về filename
        type = "image";
      }

      const payload = {
        conversation_id: conversation._id,
        sender_id: currentUser._id,
        type,
        text: finalText,
      };

      const res = await axios.post(
        "http://localhost:8080/api/messages",
        payload
      );

      // chỉ emit socket, không setMessagesData nữa
      if (socket) {
        socket.emit("send_message", {
          conversationId: conversation._id,
          receiverId: otherUser?._id,
          unreadIncrement: 1,
          ...res.data,
        });
      }

      setSelectedImage(null);
      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const endRef = useRef<HTMLDivElement | null>(null);

  // Mỗi khi messagesData thay đổi => cuộn xuống cuối
useEffect(() => {
  if (endRef.current) {
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }
}, [messagesData]);

  //Gửi ảnh
  const uploadImage = async (file: File, bucket = "conversation") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const res = await axios.post(
      "http://localhost:8080/api/upload/img",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return res.data.filename; // BE trả về filename
  };

  useEffect(() => {
    if (!conversation || !currentUser?._id || !socket) return;
    // Tự động mark-as-read khi load conversation đầu tiên
    markConversationAsRead(conversation);
  }, [conversation?._id, currentUser?._id, socket]);

  const markConversationAsRead = async (conv: IConversation) => {
    if (!conv?._id || !currentUser?._id || !socket) return;

    try {
      await axios.patch(
        `http://localhost:8080/api/messages/mark-as-read/${conv._id}`,
        { userId: currentUser._id }
      );

      socket.emit("send_message", {
        receiverId: currentUser?._id,
      });

      setConversationsData((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
      );
      setConversation((prev) => (prev ? { ...prev, unreadCount: 0 } : prev));
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  const checkTypeLastMessage = (text: string) => {
    return text.includes('conversation/') ? 'image' : 'text';
  }

    const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  return (
    <div className={cvstStyles.container}>
      {/* Sidebar */}
      <aside className={cvstStyles.sidebar}>
        <div className={cvstStyles.sidebarHeader}>Tất cả tin nhắn</div>
        <div className={cvstStyles.conversationList}>
          {conversationsData
            .filter((i) => i.last_message) // ✅ Chỉ lấy conversation có last_message
            .map((i) => {
              const otherUser = i.participants.find(
                (p) => p._id !== currentUser?._id
              );

              return (
                <div
                  key={i._id}
                  className={`${cvstStyles.conversationItem} ${
                    conversation?._id === i._id
                      ? cvstStyles.conversationItemActive
                      : ""
                  }`}
                  onClick={() => {
                    handleChangeConversation(i._id);
                  }}
                >


                  {otherUser && (
                    <div style={{ width: "100%" }}>                     
                      <div className={cvstStyles.conversationItemHeader}>
                        <Image
                          src={
                            otherUser.avatar
                              ? formatImageUrl(otherUser.avatar) ||
                                "/image/header/carbon_user-avatar-filled-alt.svg"
                              : "/image/header/carbon_user-avatar-filled-alt.svg"
                          }
                          alt="Avatar"
                          className={cvstStyles.avatar}
                          width={40}
                          height={40}
                        />
                         
                         <div>
                           <p className={cvstStyles.name}>
                          {otherUser.full_name || "Người dùng"}
                        </p>
                         <div className={cvstStyles.messageLayout}>
                            <p className={cvstStyles.lastMessage}>
                              {i.last_message?.sender_id?.full_name}:{" "}
                              {checkTypeLastMessage(i.last_message?.text || "") === 'image' ? '[Hình ảnh]' : i.last_message?.text}
                            </p>
                            {i.unreadCount != 0 ? (
                              <p className={cvstStyles.unreadCount}>
                                {i.unreadCount}
                              </p>
                            ) : (
                              <p></p>
                            )}
                        </div>
                         </div>
                       
                      </div>
                     
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </aside>

      {/* Chat area */}
      <main className={cvstStyles.chatArea}>
        {/* Header */}
        <div className={cvstStyles.chatHeader}>
 

          {otherUser && (
            <div>
               <div className={cvstStyles.userInfo}>
              <Image
                src={
                  otherUser.avatar
                    ? formatImageUrl(otherUser.avatar) ||
                      "/image/header/carbon_user-avatar-filled-alt.svg"
                    : "/image/header/carbon_user-avatar-filled-alt.svg"
                }
                alt="Avatar"
                className={cvstStyles.avatar}
                width={50}
                height={50}
              />
                <p className={cvstStyles.subtitle}>{otherUser.full_name}</p>         
            </div>
                      
            </div>
           
            
          )}
          <div className={cvstStyles.borderLine}></div>
          <div className={cvstStyles.postInfo}>
                <Image
                  src={
                    conversation?.post_id?.images?.[0]?.url
                      ? formatImageUrl(conversation.post_id.images[0].url) ||
                        "/image/header/carbon_user-avatar-filled-alt.svg"
                      : "/image/header/carbon_user-avatar-filled-alt.svg"
                  }
                  alt="Post"
                  className={cvstStyles.squareImage}
                  width={80}
                  height={80}
                  onClick={() => {
                    const postId = conversation?.post_id?._id;
                    if (!postId) return;
                    try {
                      sessionStorage.setItem(
                        `selectedPost_${postId}`,
                        JSON.stringify(conversation?.post_id)
                      );
                    } catch {}
                    router.push(
                      `/post/detailPost?postId=${encodeURIComponent(postId)}`
                    );
                  }}
                />
                <div className={cvstStyles.postText}>
                  <p className={cvstStyles.postTitle}>{conversation?.post_id?.title}</p>
                  <p >{formatCurrency(conversation?.post_id?.price ?? 0)}</p>
                </div>
              
              </div>
        </div>

        {/* Messages */}
        <div className={cvstStyles.messages}>
          {messagesData.map((msg) => {
            const isMe =
              msg?.sender_id?._id && currentUser?._id
                ? msg.sender_id._id === currentUser._id
                : false;
            if (msg.type !== "text" && msg.type !== "image") return null;
            return (
              <div
                key={msg._id}
                className={`${cvstStyles.message} ${
                  isMe
                    ? msg.type === "text"
                      ? cvstStyles.meText
                      : cvstStyles.meImage
                    : msg.type === "text"
                      ? cvstStyles.otherText
                      : cvstStyles.otherImage
                }`}
              >
                {msg.type === "text" ? (
                  msg.text
                ) : (
                  <Image
                    width={200}
                    height={200}
                    src={msg.text ? formatImageUrl(msg.text) || "" : ""}
                    alt="message"
                    className={cvstStyles.messageImage}
                  />
                )}
              </div>
            );
          })}

          {/* ref để scroll xuống cuối */}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className={cvstStyles.chatInput}>
          {/* Nếu chưa có ảnh thì hiển thị input chữ */}
          {!previewImage ? (
            <input
              type="text"
              placeholder="Type a message..."
              className={cvstStyles.input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
          ) : (
            <div className={cvstStyles.previewWrapper}>
              <img
                src={previewImage}
                alt="Preview"
                className={cvstStyles.previewImage}
              />
              <button
                className={cvstStyles.removeBtn}
                onClick={() => {
                  URL.revokeObjectURL(previewImage);
                  setSelectedImage(null);
                  setPreviewImage(null);
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* input file ẩn */}
          <input
            type="file"
            accept="image/*"
            hidden
            id="fileInput"
            title="Attach image"
            placeholder="Attach image"
            aria-label="Attach image"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (previewImage) URL.revokeObjectURL(previewImage);
                const url = URL.createObjectURL(file);
                setSelectedImage(file);
                setPreviewImage(url);
              }
            }}
          />

          {/* Nút camera */}
          <button
            className={cvstStyles.sendImgBtn}
            title="Attach image"
            aria-label="Attach image"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <Icon
                key={`image`}
                icon="material-symbols:image-outline"
                width={24}
                height={24}
              />
          </button>

          <button className={cvstStyles.sendBtn} onClick={handleSendMessage}>
            Gửi
          </button>
        </div>
      </main>
    </div>
  );
}
