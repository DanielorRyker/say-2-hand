"use client";

import { useEffect, useRef, useState } from "react";
import cvstStyles from "@/styles/pages/conversation/conversation.module.scss";
import Image from "next/image";
import axios from "axios";
import { io, Socket } from "socket.io-client";

export default function ChatPage() {
  // user hiện tại

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | File | null>(null);
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
      author_id: string;
      category_id: string;
      title: string;
      price: number;
      description: string;
      condition: "new" | "used";
      transaction_type: "sell" | "buy";
      status: "active" | "inactive";
      image: string;
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
        // console.log(user.status); // ✅ lấy được status
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
        console.log("messagesData", res.data);
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
    }
  };

  const [text, setText] = useState("");

  //Socket
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    // Kết nối socket.io tới BE (NestJS WebSocketGateway)
    const newSocket = io("http://localhost:8080", {
      transports: ["websocket"], // ép dùng websocket (tránh polling)
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
    if (!socket || !conversation?._id) return;

    socket.emit("join_conversation", { conversationId: conversation._id });

    const handleReceiveMessage = (msg: any) => {
      // Nếu tin nhắn thuộc cuộc hội thoại đang mở → append vào messagesData
      if (msg.conversation_id === conversation._id) {
        setMessagesData((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev; // tránh trùng
          return [...prev, msg];
        });
      }

      // Luôn update last_message cho sidebar
      setConversationsData((prev) =>
        prev.map((c) =>
          c._id === msg.conversation_id ? { ...c, last_message: msg } : c
        )
      );
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, conversation?._id]);

  /// Gửi tin nhắn


    

  const handleSendMessage = async () => {
    if (!text.trim() && !selectedImage) return;
    if (!conversation?._id || !currentUser?._id) return;

    try {
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
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData]);

  //Gửi ảnh
    const uploadImage = async (file: File, bucket = "conversation") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);

    const res = await axios.post("http://localhost:8080/api/upload/img", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.filename; // BE trả về filename
  };
  

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
                  <Image
                    src={
                      i.post_id.image
                        ? process.env.NEXT_PUBLIC_URL_GCS + i.post_id.image
                        : "/image/header/carbon_user-avatar-filled-alt.svg"
                    }
                    alt="Post"
                    className={cvstStyles.squareImage}
                    width={80}
                    height={80}
                  />

                  {otherUser && (
                    <div>
                      <p className={cvstStyles.title}>{i.post_id.title}</p>

                      <div className={cvstStyles.conversationItemHeader}>
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
                        <p className={cvstStyles.name}>
                          {otherUser.full_name || "Người dùng"}
                        </p>
                      </div>

                      <p className={cvstStyles.lastMessage}>
                        {i.last_message?.sender_id?.full_name}: {i.last_message?.text}
                      </p>
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
          <div>
            <Image
              src={
                conversation?.post_id.image
                  ? process.env.NEXT_PUBLIC_URL_GCS + conversation.post_id.image
                  : "/image/header/carbon_user-avatar-filled-alt.svg"
              }
              alt="Post"
              className={cvstStyles.squareImage}
              width={80}
              height={80}
            />
          </div>

          {otherUser && (
            <div className={cvstStyles.userInfo}>
              <Image
                src={
                  otherUser.avatar
                    ? process.env.NEXT_PUBLIC_URL_GCS + otherUser.avatar
                    : "/image/header/carbon_user-avatar-filled-alt.svg"
                }
                alt="Avatar"
                className={cvstStyles.avatar}
                width={50}
                height={50}
              />
              <div>
                <p className={cvstStyles.title}>
                  {conversation?.post_id.title}
                </p>
                <p className={cvstStyles.name}>{otherUser.full_name}</p>
              </div>
            </div>
          )}
        </div>

       {/* Messages */}
        <div className={cvstStyles.messages}>
          {messagesData.map((msg) => {
            const isMe = msg.sender_id._id === currentUser._id;

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
                    src={msg.text ? process.env.NEXT_PUBLIC_URL_GCS + msg.text : ""} 
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
    style={{ display: "none" }}
    id="fileInput"
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
    onClick={() => document.getElementById("fileInput")?.click()}
  >
    <Image
      src={"/image/profile/camera.svg"}
      alt="Attach"
      width={24}
      height={24}
    />
  </button>

  <button className={cvstStyles.sendBtn} onClick={handleSendMessage}>
    Send
  </button>
</div>

        
      </main>
    </div>
  );
}
