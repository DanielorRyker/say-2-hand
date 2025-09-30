"use client";

import { useEffect, useRef, useState } from "react";
import cvstStyles from "@/styles/pages/conversation/conversation.module.scss";
import Image from "next/image";
import axios from "axios";
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
 

  // user hiện tại

  const [currentUser, setCurrentUser] = useState<any>(null);

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
      full_name:string;
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
const [conversationsData, setConversationsData] = useState<IConversation[]>([]);

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
        const res = await axios.get(`http://localhost:8080/api/conversations/conversations/${user._id}`);
        setConversationsData(res.data); 
      }
      fetchPosts();
    }, []);

    const uniqueUsers = conversationsData.reduce((acc: any[], c) => {
    const otherUser = c.participants.find((p: any) => p._id !== currentUser?._id);
    if (otherUser && !acc.find(u => u._id === otherUser._id)) {
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
  const selected = conversationsData.find(c => c._id === _id);
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
  if (!text.trim()) return;
  if (!conversation?._id || !currentUser?._id) return;

  try {
    const payload = {
      conversation_id: conversation._id,
      sender_id: currentUser._id,
      type: "text",
      text: text,
    };

    const res = await axios.post("http://localhost:8080/api/messages", payload);

    // chỉ emit socket, không setMessagesData nữa
    if (socket) {
      socket.emit("send_message", {
        conversationId: conversation._id,
        ...res.data,
      });
    }

    setText("");
  } catch (error) {
    console.error("Error sending message:", error);
  }
};


// Mỗi khi messagesData thay đổi => cuộn xuống cuối
const endRef = useRef<HTMLDivElement | null>(null);


useEffect(() => {
  if (endRef.current) {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messagesData]);



  return (
    <div className={cvstStyles.container}>
      {/* Sidebar */}
      <aside className={cvstStyles.sidebar}>
        <div className={cvstStyles.sidebarHeader}>Tất cả tin nhắn</div>
        <div className={cvstStyles.conversationList}>

          {conversationsData.map((i) => (
            <div key={i._id} 
            className={`${cvstStyles.conversationItem} ${conversation?._id === i._id ? cvstStyles.conversationItemActive : ""}`} 
            onClick={() => {handleChangeConversation(i._id)}}>
              <Image
                src={i.post_id.image ? process.env.NEXT_PUBLIC_URL_GCS + i.post_id.image : "/image/header/carbon_user-avatar-filled-alt.svg"}
                alt="Post"
                className={cvstStyles.squareImage}
                width={80} height={80}
              />
             {uniqueUsers.map((otherUser) => (
                <div key={otherUser._id}>
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
                  <p className={cvstStyles.name}>{otherUser.full_name || "Người dùng"}</p>
                  </div>
                                 
                    <p className={cvstStyles.lastMessage}>{i.last_message?.sender_id?.full_name}: {i.last_message?.text}</p>
      
                 
                </div>
              ))}
              
            </div>
          ))}

          
        </div>
      </aside>

      {/* Chat area */}
      <main className={cvstStyles.chatArea}>
        {/* Header */}
        <div className={cvstStyles.chatHeader}>
         <div>
             <Image
                src={conversation?.post_id.image ? process.env.NEXT_PUBLIC_URL_GCS + conversation.post_id.image : "/image/header/carbon_user-avatar-filled-alt.svg"}
                alt="Post"
                className={cvstStyles.squareImage}
                width={80} height={80}
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
                <p className={cvstStyles.title}>{conversation?.post_id.title}</p>
                <p className={cvstStyles.name}>{otherUser.full_name}</p>
              </div>
            </div>
          )}
          
          </div>
              

        {/* Messages */}
        <div className={cvstStyles.messages}>
          {messagesData.map((msg) => (
            <div
              key={msg._id}
              className={`${cvstStyles.message} ${
                msg.sender_id._id === currentUser._id ? cvstStyles.me : cvstStyles.other
              }`}
            >
              {msg.text}
            </div>
          ))}
              {/* ref để scroll xuống cuối */}
            <div ref={endRef} />
        </div>

        

        {/* Input */}
          <div className={cvstStyles.chatInput}>
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
          <button className={cvstStyles.sendBtn} onClick={handleSendMessage}>
            Send
          </button>
        </div>

      </main>
    </div>
  );
}
