"use client";
import styleAdmin from "@/styles/pages/admin/admin.module.scss";
import axios from "axios";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

const Home = () => {
  //lấy dữ liệu
  interface Post {
  _id: string;
  title: string;
  description: string;
  images: {
    _id: string;
    url: string;
    alt?: string;
    tags: string[];
  }[];
  condition: string;
  transaction_type: string;
  price: number;
  location: {
    address: string;
    geo?: {
      type: string;
      coordinates: [number, number];
    };
  };
  custom_fields?: Record<string, string>; // ví dụ: { "màu sắc": "đen", "bộ nhớ": "128GB" }
  tags?: string[];
  status: string;
  stats?: {
    _id?: string;
    view_count: number;
    favorite_count: number;
    chat_count?: number;
  };
  moderation?: {
    _id: string;
  };
  author_id: {
    _id: string;
    full_name: string;
    avatar: string;
  };
  category_id?: {
    _id?: string;
    name?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  reputation?: {
    average_score: number;
    total_ratings: number;
  };
  distance_km?: number;
}

//Lấy user hiện tại
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  const [postsData, setPostsData] = useState<Post[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      const res = await axios.get("http://localhost:8080/api/posts/oldest");
      setPostsData(res.data); // res.data là danh sách posts
    }
    fetchPosts();
  }, []);

  // Phân trang
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(postsData.length / pageSize);
  const paginatedPosts = postsData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Sort và filter
  const handleSortByOldest = async () => {
    const res = await axios.get("http://localhost:8080/api/posts");
    setPostsData(res.data);
    setCurrentPage(1); // reset về trang 1
  };

  const handleSortByNewest = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/oldest");
    setPostsData(res.data);
    setCurrentPage(1);
  };

  const handleFilterByPending = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/pending");
    setPostsData(res.data);
    setCurrentPage(1);
  };

  const handleFilterByActive = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/active");
    setPostsData(res.data);
    setCurrentPage(1);
  };

  const handleFilterByRejected = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/rejected");
    setPostsData(res.data);
    setCurrentPage(1);
  };
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



const handlePostAction = async (typeAction: "approve" | "reject" | "delete", post: Post) => {
  try {
    let newStatus = "";
    let notificationTitle = "";
    let notificationBody = "";
    let deeplink = `/posts/${post._id}`;

    socket?.emit("join_user", { userId: post.author_id._id });
    socket?.emit("send_message", {
      receiverId: post.author_id._id, 
    });

    // 🎯 Xác định hành động
    switch (typeAction) {
      case "approve":
        newStatus = "active";
        notificationTitle = "Bài đăng của bạn đã được duyệt";
        notificationBody = `Bài đăng ${post.title}`;
        break;

      case "reject":
        newStatus = "rejected";
        notificationTitle = "Bài đăng của bạn bị từ chối";
        notificationBody = `Bài đăng ${post.title}`;
        break;

      case "delete":
        newStatus = ""; // delete không cần cập nhật status trước
        notificationTitle = "Bài đăng của bạn đã bị xóa bởi admin";
        notificationBody = `Bài đăng ${post.title}`;
        deeplink = "";
        break;
    }

      //  Gửi thông báo cho người đăng
     await axios.post(`http://localhost:8080/api/notifications`, {
      receiver_id: post.author_id._id,
      sender_id: currentUser._id,
      title: notificationTitle,
      body: notificationBody,
      type: "moderation",
      related_id: post._id,
      deeplink,
      channel: "in_app",
      is_read: false,
    });
    // Nếu không phải delete thì cập nhật trạng thái bài viết
    if (typeAction !== "delete") {
      await axios.patch(`http://localhost:8080/api/posts/${post._id}`, {
        status: newStatus,
      });

      // Cập nhật local state
      setPostsData((prev) =>
        prev.map((p) =>
          p._id === post._id ? { ...p, status: newStatus } : p
        )
      );
    } else {
      // Nếu là delete thì xóa bài
     await axios.post(`http://localhost:8080/api/deleteIMG`, {
      bucket: `posts/${post.author_id._id}/${post.title}`,
    });



      await axios.delete(`http://localhost:8080/api/posts/${post._id}`);
      setPostsData((prev) => prev.filter((p) => p._id !== post._id));
    }



  } catch (error) {
    console.error(` Lỗi khi xử lý bài đăng (${typeAction}):`, error);
  }
};


  return (
    <div className={styleAdmin.container}>
      <h2>Danh sách các bài đăng</h2>
      <div className={styleAdmin.cardSort}>
        <label>Xắp xếp theo :</label>
        <button onClick={handleSortByNewest} className={styleAdmin.btnSort}>
          Mới nhất
        </button>
        <button onClick={handleSortByOldest} className={styleAdmin.btnSort}>
          Cũ nhất
        </button>
        <button onClick={handleFilterByPending} className={styleAdmin.btnSort}>
          Chờ duyệt
        </button>
        <button onClick={handleFilterByActive} className={styleAdmin.btnSort}>
          Đã duyệt
        </button>
        <button onClick={handleFilterByRejected} className={styleAdmin.btnSort}>
          Từ chối
        </button>
      </div>
      <table style={{ borderCollapse: "collapse", width: "90%" }}>
        <thead>
          <tr>
            <th className={styleAdmin.tbheader}>#</th>
            <th className={styleAdmin.tbheader}>Title</th>
            <th className={styleAdmin.tbheader}>Images</th>
            <th className={styleAdmin.tbheader}>Author</th>
            <th className={styleAdmin.tbheader}>Category</th>
            <th className={styleAdmin.tbheader}>Description</th>
            <th className={styleAdmin.tbheader}>Price</th>
            <th className={styleAdmin.tbheader}>Condition</th>
            <th className={styleAdmin.tbheader}>Address</th>
            <th className={styleAdmin.tbheader}>Status</th>
            <th className={styleAdmin.tbheader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedPosts.map((post, idx) => (
            <tr key={post._id}>
              <td className={styleAdmin.tbrow}>
                {(currentPage - 1) * pageSize + idx + 1}
              </td>
              <td className={styleAdmin.tbrow}>{post.title}</td>
              <td className={styleAdmin.tbrow}>
                <img className={styleAdmin.postIMG} src={process.env.NEXT_PUBLIC_URL_GCS + post.images[0]?.url} alt={post.images[0]?.alt} />
              
              </td>
              <td className={styleAdmin.tbrow}>{post.author_id.full_name}</td>
              <td className={styleAdmin.tbrow}>{post.category_id?.name}</td>
              <td className={styleAdmin.tbrow}>{post.description}</td>
              <td className={styleAdmin.tbrow}>{post.price}</td>
              <td className={styleAdmin.tbrow}>{post.condition}</td>
              <td className={styleAdmin.tbrow}>{post.location.address}</td>
              <td className={styleAdmin.tbrow}>{post.status}</td>
              <td className={styleAdmin.tbrow}>
                {post.status === "active" || post.status === "rejected" || post.status === "completed" ? (
                  <>
                    <button
                      className={styleAdmin.btnEdit}
                      style={{ opacity: 0.5 }}
                      disabled
                    >
                      Active
                    </button>
                    <button
                      className={styleAdmin.btnEdit}
                      style={{ opacity: 0.5 }}
                      disabled
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handlePostAction('delete',post)}
                      className={styleAdmin.btnRemove}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handlePostAction('approve',post)}
                      className={styleAdmin.btnEdit}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handlePostAction('reject',post)}
                      className={styleAdmin.btnEdit}
                    >
                      Reject
                    </button>
                    <button
                     onClick={() => handlePostAction('delete',post)}
                      className={styleAdmin.btnRemove}
                    >
                      Remove
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Phân trang */}
      {totalPages > 1 && (
        <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ fontSize: "12px", padding: "2px 8px" }}
          >
            Trang trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                fontWeight: currentPage === i + 1 ? "bold" : "normal",
                fontSize: "12px",
                padding: "2px 8px",
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ fontSize: "12px", padding: "2px 8px" }}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};
export default Home;
