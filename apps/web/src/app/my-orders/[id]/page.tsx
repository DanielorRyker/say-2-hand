"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Transaction } from "@repo/types";
import styles from "./order-detail.module.scss";
import { useToast } from "@/components/ui/toast/ToastContext";
import { API_BASE, formatImageUrl } from "@/lib/constants";

const OrderDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/transactions/${orderId}/detail`
        );
        setOrder(response.data.data);
      } catch (error) {
        console.error("Error fetching order detail:", error);
        addToast({
          type: "error",
          message: "Không thể tải chi tiết đơn hàng",
        });
        router.push("/my-orders");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId, addToast, router]);

  const handleCompleteOrder = async () => {
    try {
      await axios.post(`${API_BASE}/api/transactions/${orderId}/complete`);
      addToast({
        type: "success",
        message: "Đã xác nhận nhận hàng thành công!",
      });
      // Reload order detail
      const response = await axios.get(
        `${API_BASE}/api/transactions/${orderId}/detail`
      );
      setOrder(response.data.data);
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Chờ xác nhận",
      shipping: "Đang giao hàng",
      completed: "Đã giao",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thanh toán thất bại",
      refunded: "Đã hoàn tiền",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Icon icon="eos-icons:loading" width={48} height={48} />
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const post = typeof order.post_id === "object" ? order.post_id : null;
  const seller = typeof order.seller_id === "object" ? order.seller_id : null;
  const buyer = typeof order.buyer_id === "object" ? order.buyer_id : null;

  return (
    <div className={styles.orderDetailPage}>
      <div className={styles.container}>
        {/* Back Button */}
        <button className={styles.backButton} onClick={() => router.back()}>
          <Icon icon="mdi:arrow-left" width={24} />
          Quay lại
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              <Icon icon="mdi:package-variant" width={36} />
              Chi tiết đơn hàng
            </h1>
            <p className={styles.orderId}>Mã đơn: {order.transaction_ref}</p>
          </div>
          <div className={styles.headerRight}>
            <div
              className={`${styles.status} ${styles[`status${order.status}`]}`}
            >
              {getStatusLabel(order.status)}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className={styles.timelineSection}>
          <h2 className={styles.sectionTitle}>
            <Icon icon="mdi:timeline-clock" width={24} />
            Tiến trình đơn hàng
          </h2>
          <div className={styles.timeline}>
            <div
              className={`${styles.timelineItem} ${order.createdAt ? styles.completed : ""}`}
            >
              <div className={styles.timelineIcon}>
                <Icon icon="mdi:cart-check" width={24} />
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>Đơn hàng đã đặt</div>
                {order.createdAt && (
                  <div className={styles.timelineTime}>
                    {formatDate(order.createdAt)}
                  </div>
                )}
                <div className={styles.timelineDesc}>
                  Đơn hàng đã được tạo và đang chờ xác nhận từ người bán
                </div>
              </div>
            </div>

            <div
              className={`${styles.timelineItem} ${order.payment_status === "paid" ? styles.completed : ""}`}
            >
              <div className={styles.timelineIcon}>
                <Icon icon="mdi:credit-card-check" width={24} />
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>Thanh toán</div>
                {order.payment_status === "paid" && order.updatedAt && (
                  <div className={styles.timelineTime}>
                    {formatDate(order.updatedAt)}
                  </div>
                )}
                <div className={styles.timelineDesc}>
                  Trạng thái: {getPaymentStatusLabel(order.payment_status)}
                  {order.payment_method && ` - ${order.payment_method}`}
                </div>
              </div>
            </div>

            <div
              className={`${styles.timelineItem} ${order.status === "shipping" || order.status === "completed" ? styles.completed : ""}`}
            >
              <div className={styles.timelineIcon}>
                <Icon icon="mdi:truck-delivery" width={24} />
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>Đang giao hàng</div>
                {order.status === "shipping" && order.updatedAt && (
                  <div className={styles.timelineTime}>
                    {formatDate(order.updatedAt)}
                  </div>
                )}
                <div className={styles.timelineDesc}>
                  {order.status === "shipping"
                    ? "Đơn hàng đang được vận chuyển đến địa chỉ của bạn"
                    : "Chờ người bán xác nhận giao hàng"}
                </div>
              </div>
            </div>

            <div
              className={`${styles.timelineItem} ${order.status === "completed" ? styles.completed : ""}`}
            >
              <div className={styles.timelineIcon}>
                <Icon icon="mdi:check-circle" width={24} />
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineTitle}>Đã nhận hàng</div>
                {order.status === "completed" && order.updatedAt && (
                  <div className={styles.timelineTime}>
                    {formatDate(order.updatedAt)}
                  </div>
                )}
                <div className={styles.timelineDesc}>
                  {order.status === "completed"
                    ? "Đơn hàng đã được giao thành công"
                    : "Chờ bạn xác nhận đã nhận hàng"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        {post && (
          <div className={styles.productSection}>
            <h2 className={styles.sectionTitle}>
              <Icon icon="mdi:package-variant-closed" width={24} />
              Thông tin sản phẩm
            </h2>
            <div className={styles.productCard}>
              <div className={styles.productImages}>
                {post.images &&
                post.images.length > 0 &&
                formatImageUrl(post.images[0].url) ? (
                  <Image
                    src={formatImageUrl(post.images[0].url)!}
                    alt={post.title || "Product"}
                    width={300}
                    height={300}
                    className={styles.mainImage}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <Icon icon="mdi:image-off" width={80} />
                  </div>
                )}
                {post.images && post.images.length > 1 && (
                  <div className={styles.thumbnails}>
                    {post.images.slice(1, 5).map((img, idx) => {
                      const imageUrl = formatImageUrl(img.url);
                      return imageUrl ? (
                        <Image
                          key={idx}
                          src={imageUrl}
                          alt={`${post.title} ${idx + 2}`}
                          width={80}
                          height={80}
                          className={styles.thumbnail}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className={styles.productInfo}>
                <h3 className={styles.productTitle}>{post.title}</h3>
                {post.description && (
                  <p className={styles.productDesc}>{post.description}</p>
                )}
                <div className={styles.productMeta}>
                  <div className={styles.metaItem}>
                    <Icon icon="mdi:tag" width={20} />
                    <span>
                      {post.transaction_type === "exchange"
                        ? "Trao đổi"
                        : "Thanh lý"}
                    </span>
                  </div>
                  {post.condition && (
                    <div className={styles.metaItem}>
                      <Icon icon="mdi:star" width={20} />
                      <span>{post.condition}</span>
                    </div>
                  )}
                  {post.status && (
                    <div className={styles.metaItem}>
                      <Icon icon="mdi:information" width={20} />
                      <span>{post.status}</span>
                    </div>
                  )}
                </div>
                <div className={styles.productPrice}>
                  {formatPrice(post.price)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seller Info */}
        {seller && (
          <div className={styles.sellerSection}>
            <h2 className={styles.sectionTitle}>
              <Icon icon="mdi:account-tie" width={24} />
              Thông tin người bán
            </h2>
            <div className={styles.sellerCard}>
              <div className={styles.sellerAvatar}>
                {seller.avatar && formatImageUrl(seller.avatar) ? (
                  <Image
                    src={formatImageUrl(seller.avatar)!}
                    alt={seller.full_name || "Seller"}
                    width={80}
                    height={80}
                    className={styles.avatar}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <Icon icon="mdi:account" width={40} />
                  </div>
                )}
              </div>
              <div className={styles.sellerInfo}>
                <h3 className={styles.sellerName}>{seller.full_name}</h3>
                <div className={styles.sellerContact}>
                  {seller.email && (
                    <div className={styles.contactItem}>
                      <Icon icon="mdi:email" width={20} />
                      <span>{seller.email}</span>
                    </div>
                  )}
                  {seller.phone && (
                    <div className={styles.contactItem}>
                      <Icon icon="mdi:phone" width={20} />
                      <span>{seller.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                className={styles.contactButton}
                onClick={() =>
                  router.push(`/conversation?sellerId=${seller._id}`)
                }
              >
                <Icon icon="mdi:chat" width={20} />
                Nhắn tin
              </button>
            </div>
          </div>
        )}

        {/* Shipping Address */}
        {post && post.location && (
          <div className={styles.addressSection}>
            <h2 className={styles.sectionTitle}>
              <Icon icon="mdi:map-marker" width={24} />
              Địa chỉ nhận hàng
            </h2>
            <div className={styles.addressCard}>
              <Icon icon="mdi:home" width={24} />
              <div className={styles.addressInfo}>
                {buyer && (
                  <div className={styles.receiverName}>{buyer.full_name}</div>
                )}
                {buyer && buyer.phone && (
                  <div className={styles.receiverPhone}>{buyer.phone}</div>
                )}
                <div className={styles.addressText}>
                  {post.location.address && `${post.location.address}, `}
                  {post.location.district && `${post.location.district}, `}
                  {post.location.province}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className={styles.paymentSection}>
          <h2 className={styles.sectionTitle}>
            <Icon icon="mdi:credit-card" width={24} />
            Thông tin thanh toán
          </h2>
          <div className={styles.paymentCard}>
            <div className={styles.paymentRow}>
              <span>Tổng tiền hàng:</span>
              <span className={styles.amount}>{formatPrice(order.amount)}</span>
            </div>
            <div className={styles.paymentRow}>
              <span>Phí vận chuyển:</span>
              <span className={styles.amount}>Miễn phí</span>
            </div>
            <div className={styles.paymentRow}>
              <span>Phương thức thanh toán:</span>
              <span>{order.payment_method || "VNPay"}</span>
            </div>
            <div className={styles.paymentRow}>
              <span>Trạng thái thanh toán:</span>
              <span
                className={`${styles.paymentStatus} ${styles[`status${order.payment_status}`]}`}
              >
                {getPaymentStatusLabel(order.payment_status)}
              </span>
            </div>
            <div className={`${styles.paymentRow} ${styles.total}`}>
              <span>Tổng thanh toán:</span>
              <span className={styles.totalAmount}>
                {formatPrice(order.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {order.status === "shipping" && (
            <button
              className={styles.completeButton}
              onClick={handleCompleteOrder}
            >
              <Icon icon="mdi:check-circle" width={24} />
              Đã nhận hàng
            </button>
          )}
          {post && order.status === "completed" && (
            <button
              className={styles.reviewButton}
              onClick={() => router.push(`/post/${post._id}?action=review`)}
            >
              <Icon icon="mdi:star" width={24} />
              Đánh giá sản phẩm
            </button>
          )}
          {seller && (
            <button
              className={styles.contactSellerButton}
              onClick={() =>
                router.push(`/conversation?sellerId=${seller._id}`)
              }
            >
              <Icon icon="mdi:chat" width={24} />
              Liên hệ người bán
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
