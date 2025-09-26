"use client";

import { useEffect, useState } from "react";
import { Route, X } from "lucide-react"; // icon đóng (nếu bạn cài lucide-react)
import Image from "next/image";
import headerStyles from "@/styles/layout/header.module.scss";
import cvstStyles from "@/styles/pages/conversation/conversationSidebar.module.scss";
import { API_BASE } from "@/lib/constants";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function ConversationsSidebar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();


  const userData = localStorage.getItem("user");
const currentUser = userData ? JSON.parse(userData) : null;


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


const [conversationsData, setConversationsData] = useState<IConversation[]>([]);

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
      console.log("conversationsData", res.data);
    }
    fetchPosts();
  }, []);

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

  const handleMessage=(conversation: IConversation)=>{
    localStorage.setItem("conversation", JSON.stringify(conversation));
    router.push(`/conversation/${conversation._id}`);
    
  }

  const uniqueUsers = conversationsData.reduce((acc: any[], c) => {
  const otherUser = c.participants.find((p: any) => p._id !== currentUser?._id);
  if (otherUser && !acc.find(u => u._id === otherUser._id)) {
    acc.push(otherUser);
  }
  return acc;
}, []);

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
        <div
          className={cvstStyles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${cvstStyles.sidebar} ${open ? cvstStyles.open : ""}`} >
        {/* Header */}
        <div className={cvstStyles.header}>
           <h2 className={cvstStyles.title}>Tin nhắn</h2>
          <button onClick={() => setOpen(false)}>
            <X className={cvstStyles.x}/>
          </button>
        </div>

        {/* Danh sách conversation */}
        <div className={cvstStyles.content}>
          {conversationsData.map((c) => (
            <div className={cvstStyles.card}  key={c._id} onClick={() => handleMessage(c)}>
              {/* Ảnh vuông bên trái */}
              <Image
                src={c.post_id.image ? process.env.NEXT_PUBLIC_URL_GCS + c.post_id.image : "/image/header/carbon_user-avatar-filled-alt.svg"}
                alt="Post"
                className={cvstStyles.squareImage}
                width={80} height={80}
              />

              <div className={cvstStyles.contentItem}>
                <div>
                  <p className={cvstStyles.titleItem}>{c.post_id.title}</p>
                </div>
               {uniqueUsers.map((otherUser) => (
                <div key={otherUser._id} className={cvstStyles.headerItem}>
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
              ))}
              
                <p className={cvstStyles.text}>
                  {c.last_message?.sender_id?.full_name}: &nbsp; 
                  {c.last_message?.text} 
                </p>
                <p className={cvstStyles.time}>{c.last_message?.created_at ? getRelativeTime(c.last_message?.created_at) : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
