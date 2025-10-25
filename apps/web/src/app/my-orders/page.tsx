"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Transaction } from "@repo/types";
import styles from "./my-orders.module.scss";
import { useToast } from "@/components/ui/toast/ToastContext";
import { API_BASE, formatImageUrl } from "@/lib/constants";

type TabType = "all" | "pending" | "shipping" | "completed";

const MyOrdersPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ _id: string; full_name: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Load user từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const fetchOrders = useCallback(
    async (status?: string) => {
      if (!user) return;

      setLoading(true);
      try {
        const url =
          status && status !== "all"
            ? `${API_BASE}/api/transactions/buyer/${user._id}?status=${status}`
            : `${API_BASE}/api/transactions/buyer/${user._id}`;

        const response = await axios.get(url);
        setOrders(response.data.data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
        addToast({ type: "error", message: "Lỗi khi tải danh sách đơn hàng" });
      } finally {
        setLoading(false);
      }
    },
    [user, addToast]
  );

  useEffect(() => {
    if (user) fetchOrders(activeTab === "all" ? undefined : activeTab);
  }, [user, activeTab, fetchOrders]);

  // Xử lý xác nhận đã nhận hàng
  const handleCompleteOrder = async (orderId: string) => {
    try {
      await axios.post(`${API_BASE}/api/transactions/${orderId}/complete`);
      addToast({
        type: "success",
        message: "Đã xác nhận nhận hàng thành công!",
      });
      fetchOrders(activeTab === "all" ? undefined : activeTab);
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  // Xem chi tiết đơn hàng
  const handleViewDetail = (orderId: string) => {
    router.push(`/my-orders/${orderId}`);
  };

  // Liên hệ người bán
  const handleContactSeller = (order: Transaction) => {
    if (typeof order.seller_id === "object" && order.seller_id._id) {
      // Redirect to conversation with seller
      router.push(`/conversation?sellerId=${order.seller_id._id}`);
    }
  };

  // Format tiền VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format thời gian
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Lấy status label
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Chờ xác nhận",
      shipping: "Đang giao hàng",
      completed: "Đã giao",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  // Lấy status color class
  const getStatusClass = (status: string) => {
    const classMap: Record<string, string> = {
      pending: styles.statusPending,
      shipping: styles.statusShipping,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled,
    };
    return classMap[status] || "";
  };

  // Render danh sách đơn hàng
  const renderOrders = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <Icon icon="eos-icons:loading" width={48} height={48} />
          <p>Đang tải đơn hàng...</p>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className={styles.emptyContainer}>
          <Icon icon="mdi:package-variant" width={80} height={80} />
          <h3>Chưa có đơn hàng nào</h3>
          <p>Bạn chưa mua sản phẩm nào. Hãy khám phá các sản phẩm hấp dẫn!</p>
          <button
            className={styles.exploreButton}
            onClick={() => router.push("/")}
          >
            <Icon icon="mdi:compass" width={20} height={20} />
            Khám phá ngay
          </button>
        </div>
      );
    }

    return (
      <div className={styles.ordersList}>
        {orders.map((order) => {
          const post = typeof order.post_id === "object" ? order.post_id : null;
          const seller =
            typeof order.seller_id === "object" ? order.seller_id : null;

          return (
            <div key={order._id} className={styles.orderCard}>
              {/* Header đơn hàng */}
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <Icon icon="mdi:package-variant-closed" width={20} />
                  <span className={styles.orderId}>
                    Mã đơn: {order.transaction_ref}
                  </span>
                </div>
                <div
                  className={`${styles.orderStatus} ${getStatusClass(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* Thông tin sản phẩm */}
              {post && (
                <div className={styles.productInfo}>
                  <div className={styles.productImage}>
                    {post.images &&
                    post.images.length > 0 &&
                    formatImageUrl(post.images[0].url) ? (
                      <Image
                        src={formatImageUrl(post.images[0].url)!}
                        alt={post.title || "Product"}
                        width={100}
                        height={100}
                        className={styles.image}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <Icon icon="mdi:image-off" width={40} />
                      </div>
                    )}
                  </div>
                  <div className={styles.productDetails}>
                    <h3 className={styles.productTitle}>{post.title}</h3>
                    <div className={styles.productPrice}>
                      {formatPrice(post.price)}
                    </div>
                    <div className={styles.productMeta}>
                      <span>
                        <Icon icon="mdi:tag" width={16} />
                        {post.transaction_type === "exchange"
                          ? "Trao đổi"
                          : "Thanh lý"}
                      </span>
                      {post.condition && (
                        <span>
                          <Icon icon="mdi:star" width={16} />
                          {post.condition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Thông tin người bán */}
              {seller && (
                <div className={styles.sellerInfo}>
                  <div className={styles.sellerAvatar}>
                    {seller.avatar && formatImageUrl(seller.avatar) ? (
                      <Image
                        src={formatImageUrl(seller.avatar)!}
                        alt={seller.full_name || "Seller"}
                        width={40}
                        height={40}
                        className={styles.avatar}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const placeholder = document.createElement("div");
                          placeholder.className = styles.avatarPlaceholder;
                          e.currentTarget.parentElement?.appendChild(
                            placeholder
                          );
                        }}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        <Icon icon="mdi:account" width={24} />
                      </div>
                    )}
                  </div>
                  <div className={styles.sellerDetails}>
                    <div className={styles.sellerName}>{seller.full_name}</div>
                    <div className={styles.sellerContact}>
                      {seller.phone && (
                        <span>
                          <Icon icon="mdi:phone" width={14} />
                          {seller.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.contactButton}
                    onClick={() => handleContactSeller(order)}
                  >
                    <Icon icon="mdi:chat" width={20} />
                    Liên hệ
                  </button>
                </div>
              )}

              {/* Timeline đơn hàng */}
              <div className={styles.orderTimeline}>
                <div
                  className={`${styles.timelineStep} ${order.createdAt ? styles.active : ""}`}
                >
                  <div className={styles.timelineIcon}>
                    <Icon icon="mdi:cart" width={16} />
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Đặt hàng</div>
                    {order.createdAt && (
                      <div className={styles.timelineTime}>
                        {formatDate(order.createdAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`${styles.timelineStep} ${order.payment_status === "paid" ? styles.active : ""}`}
                >
                  <div className={styles.timelineIcon}>
                    <Icon icon="mdi:credit-card" width={16} />
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Thanh toán</div>
                    {order.payment_status === "paid" && order.updatedAt && (
                      <div className={styles.timelineTime}>
                        {formatDate(order.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`${styles.timelineStep} ${order.status === "shipping" || order.status === "completed" ? styles.active : ""}`}
                >
                  <div className={styles.timelineIcon}>
                    <Icon icon="mdi:truck-delivery" width={16} />
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Đang giao</div>
                    {order.status === "shipping" && order.updatedAt && (
                      <div className={styles.timelineTime}>
                        {formatDate(order.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`${styles.timelineStep} ${order.status === "completed" ? styles.active : ""}`}
                >
                  <div className={styles.timelineIcon}>
                    <Icon icon="mdi:check-circle" width={16} />
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineLabel}>Đã nhận</div>
                    {order.status === "completed" && order.updatedAt && (
                      <div className={styles.timelineTime}>
                        {formatDate(order.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Địa chỉ giao hàng */}
              {post && post.location && (
                <div className={styles.shippingAddress}>
                  <Icon icon="mdi:map-marker" width={20} />
                  <div className={styles.addressContent}>
                    <div className={styles.addressLabel}>Địa chỉ nhận hàng</div>
                    <div className={styles.addressText}>
                      {post.location.address && `${post.location.address}, `}
                      {post.location.district && `${post.location.district}, `}
                      {post.location.province}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.orderActions}>
                <button
                  className={styles.detailButton}
                  onClick={() => handleViewDetail(order._id)}
                >
                  <Icon icon="mdi:eye" width={20} />
                  Xem chi tiết
                </button>

                {order.status === "shipping" && (
                  <button
                    className={styles.completeButton}
                    onClick={() => handleCompleteOrder(order._id)}
                  >
                    <Icon icon="mdi:check-circle" width={20} />
                    Đã nhận hàng
                  </button>
                )}

                {post && order.status === "completed" && (
                  <button
                    className={styles.reviewButton}
                    onClick={() =>
                      router.push(`/post/${post._id}?action=review`)
                    }
                  >
                    <Icon icon="mdi:star" width={20} />
                    Đánh giá
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.myOrdersPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Icon icon="mdi:shopping" width={40} height={40} />
            Đơn mua của tôi
          </h1>
          <p className={styles.subtitle}>
            Quản lý và theo dõi các đơn hàng bạn đã mua
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <Icon icon="mdi:format-list-bulleted" width={20} />
            Tất cả
          </button>
          <button
            className={`${styles.tab} ${activeTab === "pending" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <Icon icon="mdi:clock-outline" width={20} />
            Chờ xác nhận
          </button>
          <button
            className={`${styles.tab} ${activeTab === "shipping" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("shipping")}
          >
            <Icon icon="mdi:truck-delivery" width={20} />
            Đang giao
          </button>
          <button
            className={`${styles.tab} ${activeTab === "completed" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            <Icon icon="mdi:check-circle" width={20} />
            Đã giao
          </button>
        </div>

        {/* Orders List */}
        {renderOrders()}
      </div>
    </div>
  );
};

export default MyOrdersPage;
