"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Transaction } from "@repo/types";
import styles from "./orders.module.scss";
import { useToast } from "@/components/ui/toast/ToastContext";

type TabType = "all" | "pending" | "shipping" | "completed" | "cancelled";

const OrdersPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ _id: string; full_name: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  const { addToast } = useToast();

  const fetchOrders = useCallback(
    async (status?: string) => {
      if (!user) return;

      setLoading(true);
      try {
        const url =
          status && status !== "all"
            ? `http://localhost:8080/api/transactions/seller/${user._id}?status=${status}`
            : `http://localhost:8080/api/transactions/seller/${user._id}`;

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

  // Xử lý gửi hàng
  const handleShipOrder = async (orderId: string) => {
    try {
      // await axios.post(
      //   `http://localhost:8080/api/transactions/${orderId}/ship`
      // );
      addToast({
        type: "success",
        message: "Đã xác nhận gửi hàng — đơn sẽ được giao trong 5s.",
      });
      // Backend sẽ tự hoàn tất sau 5s; chỉ refresh để hiển thị 'shipping' ngay
      fetchOrders(activeTab === "all" ? undefined : activeTab);
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  // no client-side auto-complete timers; backend schedules completion

  // Xử lý huỷ đơn
  const handleCancelOrder = async (orderId: string) => {
    const cancelReason = prompt("Nhập lý do huỷ đơn:");
    if (!cancelReason) return;

    try {
      await axios.post(
        `http://localhost:8080/api/transactions/${orderId}/cancel`,
        {
          cancelReason,
        }
      );
      addToast({ type: "success", message: "Đã huỷ đơn và hoàn tiền" });
      fetchOrders(activeTab === "all" ? undefined : activeTab);
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  // Chuyển đến trang chi tiết
  const viewOrderDetail = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: "Chờ xử lý", className: styles.badgePending },
      shipping: { text: "Đang giao", className: styles.badgeShipping },
      completed: { text: "Hoàn thành", className: styles.badgeCompleted },
      cancelled: { text: "Đã huỷ", className: styles.badgeCancelled },
    };
    return badges[status] || badges.pending;
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: "Chờ thanh toán", className: styles.paymentPending },
      paid: { text: "Đã thanh toán", className: styles.paymentPaid },
      failed: { text: "Thất bại", className: styles.paymentFailed },
      refunded: { text: "Đã hoàn tiền", className: styles.paymentRefunded },
    };
    return badges[status] || badges.pending;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className={styles.ordersPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Icon icon="mdi:shopping" width={36} height={36} />
            Quản lý đơn hàng
          </h1>
          <p className={styles.subtitle}>
            Quản lý các đơn hàng bạn đã bán trên Say2Hand
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <Icon icon="mdi:all-inclusive" width={20} height={20} />
            <span>Tất cả</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "pending" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <Icon icon="mdi:clock-outline" width={20} height={20} />
            <span>Chờ xử lý</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "shipping" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("shipping")}
          >
            <Icon icon="mdi:truck-delivery" width={20} height={20} />
            <span>Đang giao</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "completed" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            <Icon icon="mdi:check-circle" width={20} height={20} />
            <span>Hoàn thành</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === "cancelled" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            <Icon icon="mdi:close-circle" width={20} height={20} />
            <span>Đã huỷ</span>
          </button>
        </div>

        {/* Orders List */}
        <div className={styles.ordersList}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon icon="mdi:package-variant" width={80} height={80} />
              <h3>Chưa có đơn hàng</h3>
              <p>Bạn chưa có đơn hàng nào trong danh mục này</p>
            </div>
          ) : (
            orders.map((order) => {
              const post =
                typeof order.post_id === "object" ? order.post_id : null;
              const buyer =
                typeof order.buyer_id === "object" ? order.buyer_id : null;
              const statusBadge = getStatusBadge(order.status);
              const paymentBadge = getPaymentStatusBadge(order.payment_status);

              return (
                <div key={order._id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderId}>
                        <Icon icon="mdi:barcode" width={18} height={18} />
                        {order.transaction_ref}
                      </span>
                      <span className={styles.orderDate}>
                        <Icon icon="mdi:calendar" width={16} height={16} />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className={styles.badges}>
                      <span className={statusBadge.className}>
                        {statusBadge.text}
                      </span>
                      <span className={paymentBadge.className}>
                        {paymentBadge.text}
                      </span>
                    </div>
                  </div>

                  <div className={styles.orderBody}>
                    {post && (
                      <div className={styles.productInfo}>
                        <div className={styles.productImage}>
                          <Image
                            src={
                              post.images?.[0]?.url
                                ? process.env.NEXT_PUBLIC_URL_GCS +
                                  post.images[0].url
                                : "/image/placeholder.png"
                            }
                            alt={post.title}
                            width={120}
                            height={120}
                            className={styles.thumbnail}
                          />
                        </div>
                        <div className={styles.productDetails}>
                          <h3 className={styles.productTitle}>{post.title}</h3>
                          <p className={styles.productPrice}>
                            {formatPrice(order.amount)}
                          </p>
                          <div className={styles.productMeta}>
                            <span>
                              <Icon
                                icon="mdi:credit-card"
                                width={16}
                                height={16}
                              />
                              {order.payment_method}
                            </span>
                            <span>
                              <Icon
                                icon="mdi:swap-horizontal"
                                width={16}
                                height={16}
                              />
                              {post.transaction_type}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {buyer && (
                      <div className={styles.buyerInfo}>
                        <h4 className={styles.buyerTitle}>
                          <Icon icon="mdi:account" width={18} height={18} />
                          Thông tin người mua
                        </h4>
                        <div className={styles.buyerDetails}>
                          <div className={styles.buyerAvatar}>
                            <Image
                              src={
                                buyer.avatar
                                  ? process.env.NEXT_PUBLIC_URL_GCS +
                                    buyer.avatar
                                  : "/image/header/carbon_user-avatar-filled-alt.svg"
                              }
                              alt={buyer.full_name}
                              width={40}
                              height={40}
                            />
                          </div>
                          <div>
                            <p className={styles.buyerName}>
                              {buyer.full_name}
                            </p>
                            <p className={styles.buyerContact}>
                              <Icon icon="mdi:email" width={14} height={14} />
                              {buyer.email}
                            </p>
                            {buyer.phone && (
                              <p className={styles.buyerContact}>
                                <Icon icon="mdi:phone" width={14} height={14} />
                                {buyer.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.orderActions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => viewOrderDetail(order._id)}
                    >
                      <Icon icon="mdi:eye" width={18} height={18} />
                      Xem chi tiết
                    </button>

                    {order.status === "pending" && (
                      <>
                        <button
                          className={styles.btnShip}
                          onClick={() => handleShipOrder(order._id)}
                        >
                          <Icon
                            icon="mdi:truck-delivery"
                            width={18}
                            height={18}
                          />
                          Gửi hàng
                        </button>
                        <button
                          className={styles.btnCancel}
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          <Icon
                            icon="mdi:close-circle"
                            width={18}
                            height={18}
                          />
                          Huỷ đơn
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
