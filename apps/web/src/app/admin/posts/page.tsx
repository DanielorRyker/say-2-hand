"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import Image from "next/image";
import { Table, Pagination, FilterBar } from "@/components/admin";
import styles from "./posts.module.scss";
import { API_BASE, formatImageUrl } from "@/lib/constants";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { send } from "process";

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
  tags?: string[];
  status: string;
  stats?: {
    view_count: number;
    favorite_count: number;
    chat_count?: number;
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
}

type TabType = "all" | "pending_approval" | "active" | "rejected" | "completed";

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("pending_approval");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [moderationForm, setModerationForm] = useState({
    status: "active" as "active" | "rejected",
    reject_reason: "",
  });

  const [user, setUser] = useState<{ _id: string; full_name: string } | null>(
    null
  );
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/auth/login");
    }
  }, [router]);
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

  const sendNotification = async (post: Post, action: string) => {
    if (!post || !post._id || !user?._id) {
      console.warn("Thiếu dữ liệu khi gửi thông báo", post);
      return;
    }
    let title = "";
    let body = "";
    if (action === "approve") {
      title = "Bài đăng của bạn đã được duyệt";
      body = `Bài đăng ${post.title} của bạn đã được duyệt và hiển thị trên nền tảng.`;
    } else if (action === "reject") {
      title = "Bài đăng của bạn đã bị từ chối";
      body = `Bài đăng ${post.title} của bạn đã bị từ chối.\nLý do: ${moderationForm.reject_reason}`;
    } else if (action === "remove") {
      title = "Bài đăng của bạn đã bị xóa";
      body = `Bài đăng ${post.title} của bạn đã bị xóa. Cảm ơn bạn đã sử dụng dịch vụ.`;
    }
    try {
      await axios.post("http://localhost:8080/api/notifications", {
        receiver_id: post.author_id._id,
        sender_id: user._id,
        title: title,
        body: body,
        type: "moderation",
        related_id: post._id,
        related_model: "Post",
        deeplink: `/post/detailPost?postId=${post._id}`,
        channel: "in_app",
        is_read: false,
      });

      // socket?.emit("join_user",  order.buyer_id._id, );
      socket?.emit("send_message", {
        receiverId: post.author_id._id,
        message: "Notification",
      });

      console.log("✅ Gửi thông báo thành công cho người bán");
    } catch (error) {
      console.error("❌ Gửi thông báo cho người bán thất bại:", error);
      alert("Gửi thông báo cho người bán thất bại");
    }
  };
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter state
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const filterPosts = useCallback(() => {
    let filtered = [...posts];

    if (activeTab !== "all") {
      filtered = filtered.filter((post) => post.status === activeTab);
    }

    // Apply active filters
    if (
      activeFilters.transaction_type &&
      activeFilters.transaction_type !== ""
    ) {
      filtered = filtered.filter(
        (post) => post.transaction_type === activeFilters.transaction_type
      );
    }

    if (activeFilters.condition && activeFilters.condition !== "") {
      filtered = filtered.filter(
        (post) => post.condition === activeFilters.condition
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author_id?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Sort by newest first
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredPosts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [posts, activeTab, activeFilters, searchQuery]);

  useEffect(() => {
    filterPosts();
  }, [filterPosts]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/posts/`);
      setPosts(res.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePost = async (post: Post) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_BASE}/api/posts/${post._id}`,
        { status: "active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, status: "active" } : p))
      );
      sendNotification(post, "approve");
      alert("Đã duyệt bài đăng");
      setSelectedPost(null);
    } catch (error) {
      console.error("Error approving post:", error);
      alert("Có lỗi xảy ra");
    }
  };

  const handleRejectPost = async (post: Post) => {
    if (!moderationForm.reject_reason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_BASE}/api/posts/${post._id}`,
        {
          status: "rejected",
          moderation: { reject_reason: moderationForm.reject_reason },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, status: "rejected" } : p))
      );
      alert("Đã từ chối bài đăng");
      sendNotification(post, "reject");
      setSelectedPost(null);
      setModerationForm({ status: "active", reject_reason: "" });
    } catch (error) {
      console.error("Error rejecting post:", error);
      alert("Có lỗi xảy ra");
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;

    try {
      sendNotification(post, "remove");
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_BASE}/api/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p._id !== post._id));

      alert("Đã xóa bài đăng");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Có lỗi xảy ra");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10b981";
      case "pending_approval":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      case "completed":
        return "#6366f1";
      default:
        return "#94a3b8";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "pending_approval":
        return "Chờ duyệt";
      case "rejected":
        return "Đã từ chối";
      case "completed":
        return "Đã hoàn tất";
      default:
        return status;
    }
  };

  const columns = [
    {
      key: "images",
      title: "Hình ảnh",
      width: "100px",
      render: (_: any, post: Post) => (
        <div className={styles.imageCell}>
          {post.images && post.images.length > 0 ? (
            <Image
              src={
                formatImageUrl(post.images[0].url) ||
                "/image/post/placeholder.png"
              }
              alt={post.title}
              width={80}
              height={80}
              unoptimized
            />
          ) : (
            <div className={styles.noImage}>
              <Icon icon="mdi:image-off" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "title",
      title: "Tiêu đề",
      render: (_: any, post: Post) => (
        <div className={styles.postInfo}>
          <p className={styles.title}>{post.title}</p>
          <p className={styles.author}>
            <Icon icon="mdi:account" />
            {post.author_id?.full_name}
          </p>
          <p className={styles.category}>
            <Icon icon="mdi:shape" />
            {post.category_id?.name || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "transaction_type",
      title: "Loại",
      render: (type: string) => (
        <span className={`${styles.typeBadge} ${styles[type]}`}>
          {type === "sell"
            ? "Bán"
            : type === "exchange"
              ? "Trao đổi"
              : "Cho tặng"}
        </span>
      ),
    },
    {
      key: "price",
      title: "Giá",
      render: (price: number) => (
        <span className={styles.price}>
          {price > 0 ? `${price.toLocaleString("vi-VN")} VNĐ` : "Miễn phí"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (status: string) => (
        <span
          className={styles.status}
          style={{ backgroundColor: getStatusColor(status) }}
        >
          {getStatusLabel(status)}
        </span>
      ),
    },
    {
      key: "stats",
      title: "Thống kê",
      render: (stats: Post["stats"]) => (
        <div className={styles.stats}>
          <span title="Lượt xem">
            <Icon icon="mdi:eye" />
            {stats?.view_count || 0}
          </span>
          <span title="Yêu thích">
            <Icon icon="mdi:heart" />
            {stats?.favorite_count || 0}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      title: "Ngày đăng",
      render: (date: string) => (
        <span className={styles.date}>
          {new Date(date).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Hành động",
      render: (_: any, post: Post) => (
        <div className={styles.actions}>
          <button
            className={styles.btnView}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPost(post);
            }}
            title="Xem chi tiết"
          >
            <Icon icon="mdi:eye" />
          </button>
          {post.status === "pending_approval" && (
            <>
              <button
                className={styles.btnApprove}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprovePost(post);
                }}
                title="Duyệt bài"
              >
                <Icon icon="mdi:check" />
              </button>
              <button
                className={styles.btnReject}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPost(post);
                  setModerationForm({ ...moderationForm, status: "rejected" });
                }}
                title="Từ chối"
              >
                <Icon icon="mdi:close" />
              </button>
            </>
          )}
          <button
            className={styles.btnDelete}
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePost(post);
            }}
            title="Xóa"
          >
            <Icon icon="mdi:delete" />
          </button>
        </div>
      ),
    },
  ];

  const tabs = [
    {
      key: "pending_approval",
      label: "Chờ duyệt",
      icon: "mdi:clock-alert",
      count: posts.filter((p) => p.status === "pending_approval").length,
    },
    {
      key: "active",
      label: "Đang hoạt động",
      icon: "mdi:check-circle",
      count: posts.filter((p) => p.status === "active").length,
    },
    {
      key: "rejected",
      label: "Đã từ chối",
      icon: "mdi:close-circle",
      count: posts.filter((p) => p.status === "rejected").length,
    },
    {
      key: "completed",
      label: "Đã hoàn tất",
      icon: "mdi:checkbox-marked-circle",
      count: posts.filter((p) => p.status === "completed").length,
    },
    {
      key: "all",
      label: "Tất cả",
      icon: "mdi:format-list-bulleted",
      count: posts.length,
    },
  ];

  // Filter configuration
  const filterConfig = [
    {
      label: "Loại giao dịch",
      key: "transaction_type",
      options: [
        { label: "Tất cả", value: "" },
        {
          label: "Bán",
          value: "sell",
          count: posts.filter((p) => p.transaction_type === "sell").length,
        },
        {
          label: "Trao đổi",
          value: "exchange",
          count: posts.filter((p) => p.transaction_type === "exchange").length,
        },
        {
          label: "Cho tặng",
          value: "gift",
          count: posts.filter((p) => p.transaction_type === "gift").length,
        },
      ],
    },
    {
      label: "Tình trạng",
      key: "condition",
      options: [
        { label: "Tất cả", value: "" },
        {
          label: "Mới",
          value: "new",
          count: posts.filter((p) => p.condition === "new").length,
        },
        {
          label: "Đã sử dụng",
          value: "used",
          count: posts.filter((p) => p.condition === "used").length,
        },
      ],
    },
  ];

  // Pagination calculation
  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className={styles.postsPage}>
      <div className={styles.header}>
        <h1>
          <Icon icon="mdi:post" />
          Quản lý Bài đăng
        </h1>
        <div className={styles.searchBox}>
          <Icon icon="mdi:magnify" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <Icon icon={tab.icon} />
            <span>{tab.label}</span>
            <span className={styles.badge}>{tab.count}</span>
          </button>
        ))}
      </div>

      <FilterBar
        filters={filterConfig}
        activeFilters={activeFilters}
        onFilterChange={(key, value) => {
          setActiveFilters({ ...activeFilters, [key]: value });
        }}
        onClearAll={() => setActiveFilters({})}
      />

      <Table columns={columns} data={paginatedPosts} loading={loading} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          maxVisible={5}
        />
      )}

      {/* Modal chi tiết bài đăng */}
      {selectedPost && (
        <div className={styles.modal} onClick={() => setSelectedPost(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Chi tiết Bài đăng</h2>
              <button onClick={() => setSelectedPost(null)} title="Đóng">
                <Icon icon="mdi:close" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.postDetail}>
                <div className={styles.imageGallery}>
                  {selectedPost.images && selectedPost.images.length > 0 ? (
                    selectedPost.images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={
                          formatImageUrl(img.url) ||
                          "/image/post/placeholder.png"
                        }
                        alt={img.alt || selectedPost.title}
                        width={200}
                        height={200}
                        unoptimized
                      />
                    ))
                  ) : (
                    <div className={styles.noImage}>
                      <Icon icon="mdi:image-off" />
                      <p>Không có hình ảnh</p>
                    </div>
                  )}
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Tiêu đề:</label>
                    <span>{selectedPost.title}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Mô tả:</label>
                    <span>{selectedPost.description}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Tác giả:</label>
                    <span>{selectedPost.author_id?.full_name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Danh mục:</label>
                    <span>{selectedPost.category_id?.name || "N/A"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Loại giao dịch:</label>
                    <span
                      className={`${styles.typeBadge} ${styles[selectedPost.transaction_type]}`}
                    >
                      {selectedPost.transaction_type === "sell"
                        ? "Bán"
                        : selectedPost.transaction_type === "exchange"
                          ? "Trao đổi"
                          : "Cho tặng"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Giá:</label>
                    <span>
                      {selectedPost.price > 0
                        ? `${selectedPost.price.toLocaleString("vi-VN")} VNĐ`
                        : "Miễn phí"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Tình trạng:</label>
                    <span>{selectedPost.condition}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Địa chỉ:</label>
                    <span>{selectedPost.location?.address || "N/A"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Trạng thái:</label>
                    <span
                      className={styles.status}
                      style={{
                        backgroundColor: getStatusColor(selectedPost.status),
                      }}
                    >
                      {getStatusLabel(selectedPost.status)}
                    </span>
                  </div>
                </div>

                {selectedPost.status === "pending_approval" && (
                  <div className={styles.moderationActions}>
                    <h3>Kiểm duyệt bài đăng</h3>
                    <div className={styles.formGroup}>
                      <label>Hành động</label>
                      {/* Thêm aria-label để đảm bảo khả năng truy cập cho select */}
                      <select
                        aria-label="Chọn hành động kiểm duyệt"
                        value={moderationForm.status}
                        onChange={(e) =>
                          setModerationForm({
                            ...moderationForm,
                            status: e.target.value as any,
                          })
                        }
                      >
                        <option value="active">Duyệt bài</option>
                        <option value="rejected">Từ chối</option>
                      </select>
                    </div>

                    {moderationForm.status === "rejected" && (
                      <div className={styles.formGroup}>
                        <label>Lý do từ chối *</label>
                        <textarea
                          value={moderationForm.reject_reason}
                          onChange={(e) =>
                            setModerationForm({
                              ...moderationForm,
                              reject_reason: e.target.value,
                            })
                          }
                          placeholder="Nhập lý do từ chối bài đăng..."
                          rows={4}
                        />
                      </div>
                    )}

                    <div className={styles.btnGroup}>
                      {moderationForm.status === "active" ? (
                        <button
                          className={styles.btnSubmit}
                          onClick={() => handleApprovePost(selectedPost)}
                        >
                          <Icon icon="mdi:check" />
                          Duyệt bài
                        </button>
                      ) : (
                        <button
                          className={styles.btnSubmit}
                          onClick={() => handleRejectPost(selectedPost)}
                        >
                          <Icon icon="mdi:close" />
                          Từ chối
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
