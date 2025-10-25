"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Transaction } from "@repo/types";
import styles from "./transaction-detail.module.scss";
import { useToast } from "@/components/ui/toast/ToastContext";
import { API_BASE } from "@/lib/constants";

const AdminTransactionDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const transactionId = params?.id as string;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchTransactionDetail = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/transactions/${transactionId}/detail`
      );
      setTransaction(response.data.data);
    } catch (error) {
      console.error("Error fetching transaction detail:", error);
      addToast({ type: "error", message: "Lỗi khi tải chi tiết giao dịch" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      fetchTransactionDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải chi tiết giao dịch...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className={styles.errorContainer}>
        <Icon icon="mdi:alert-circle" width={80} height={80} />
        <h2>Không tìm thấy giao dịch</h2>
        <button onClick={() => router.back()} className={styles.backButton}>
          <Icon icon="mdi:arrow-left" width={20} height={20} />
          Quay lại
        </button>
      </div>
    );
  }

  const post =
    typeof transaction.post_id === "object" ? transaction.post_id : null;
  const buyer =
    typeof transaction.buyer_id === "object" ? transaction.buyer_id : null;
  const seller =
    typeof transaction.seller_id === "object" ? transaction.seller_id : null;

  return (
    <div className={styles.transactionDetailPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button
            onClick={() => router.back()}
            className={styles.backBtn}
            title="Quay lại"
          >
            <Icon icon="mdi:arrow-left" width={24} height={24} />
          </button>
          <div>
            <h1 className={styles.title}>Chi tiết giao dịch</h1>
            <p className={styles.transactionRef}>
              Mã giao dịch: {transaction.transaction_ref}
            </p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Status Timeline */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icon icon="mdi:timeline" width={24} height={24} />
              Trạng thái giao dịch
            </h2>
            <div className={styles.timeline}>
              <div className={`${styles.timelineItem} ${styles.active}`}>
                <div className={styles.timelineIcon}>
                  <Icon icon="mdi:cart" width={24} height={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Đơn hàng đã tạo</h4>
                  <p>{formatDate(transaction.createdAt)}</p>
                </div>
              </div>

              <div
                className={`${styles.timelineItem} ${transaction.payment_status === "paid" ? styles.active : ""}`}
              >
                <div className={styles.timelineIcon}>
                  <Icon icon="mdi:credit-card" width={24} height={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Đã thanh toán</h4>
                  {transaction.paid_at && (
                    <p>{formatDate(transaction.paid_at)}</p>
                  )}
                </div>
              </div>

              <div
                className={`${styles.timelineItem} ${transaction.status === "shipping" || transaction.status === "completed" ? styles.active : ""}`}
              >
                <div className={styles.timelineIcon}>
                  <Icon icon="mdi:truck-delivery" width={24} height={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Đang giao hàng</h4>
                  {transaction.shipped_at && (
                    <p>{formatDate(transaction.shipped_at)}</p>
                  )}
                </div>
              </div>

              <div
                className={`${styles.timelineItem} ${transaction.status === "completed" ? styles.active : ""}`}
              >
                <div className={styles.timelineIcon}>
                  <Icon icon="mdi:check-circle" width={24} height={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Hoàn thành</h4>
                  {transaction.completed_at && (
                    <p>{formatDate(transaction.completed_at)}</p>
                  )}
                </div>
              </div>

              {transaction.status === "cancelled" && (
                <div
                  className={`${styles.timelineItem} ${styles.active} ${styles.cancelled}`}
                >
                  <div className={styles.timelineIcon}>
                    <Icon icon="mdi:close-circle" width={24} height={24} />
                  </div>
                  <div className={styles.timelineContent}>
                    <h4>Đã hủy</h4>
                    {transaction.cancelled_at && (
                      <p>{formatDate(transaction.cancelled_at)}</p>
                    )}
                    {transaction.cancel_reason && (
                      <p className={styles.cancelReason}>
                        Lý do: {transaction.cancel_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          {post && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icon icon="mdi:package-variant" width={24} height={24} />
                Thông tin sản phẩm
              </h2>
              <div className={styles.productCard}>
                <div className={styles.productImages}>
                  {post.images && post.images.length > 0 && (
                    <Image
                      src={process.env.NEXT_PUBLIC_URL_GCS + post.images[0].url}
                      alt={post.title}
                      width={300}
                      height={300}
                      className={styles.mainImage}
                    />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <h3>{post.title}</h3>
                  <p className={styles.productPrice}>
                    {formatPrice(transaction.amount)}
                  </p>
                  {post.description && (
                    <p className={styles.productDescription}>
                      {post.description}
                    </p>
                  )}
                  <div className={styles.productMeta}>
                    <span>
                      <Icon icon="mdi:swap-horizontal" width={18} height={18} />
                      {post.transaction_type === "exchange"
                        ? "Trao đổi"
                        : "Thanh lý"}
                    </span>
                    {post.condition && (
                      <span>
                        <Icon icon="mdi:star" width={18} height={18} />
                        {post.condition}
                      </span>
                    )}
                    <span>
                      <Icon icon="mdi:tag" width={18} height={18} />
                      {post.status}
                    </span>
                  </div>
                  {post.location && (
                    <div className={styles.location}>
                      <Icon icon="mdi:map-marker" width={18} height={18} />
                      <span>
                        {(post.location as any).address &&
                          `${(post.location as any).address}, `}
                        {(post.location as any).district &&
                          `${(post.location as any).district}, `}
                        {(post.location as any).province}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={styles.twoColumns}>
            {/* Buyer Info */}
            {buyer && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <Icon icon="mdi:account-cash" width={24} height={24} />
                  Thông tin người mua
                </h2>
                <div className={styles.userCard}>
                  <div className={styles.userAvatar}>
                    <Image
                      src={
                        buyer.avatar
                          ? process.env.NEXT_PUBLIC_URL_GCS + buyer.avatar
                          : "/image/header/carbon_user-avatar-filled-alt.svg"
                      }
                      alt={buyer.full_name}
                      width={80}
                      height={80}
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <h3>{buyer.full_name}</h3>
                    <p>
                      <Icon icon="mdi:email" width={18} height={18} />
                      {buyer.email}
                    </p>
                    {buyer.phone && (
                      <p>
                        <Icon icon="mdi:phone" width={18} height={18} />
                        {buyer.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Seller Info */}
            {seller && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <Icon icon="mdi:store" width={24} height={24} />
                  Thông tin người bán
                </h2>
                <div className={styles.userCard}>
                  <div className={styles.userAvatar}>
                    <Image
                      src={
                        seller.avatar
                          ? process.env.NEXT_PUBLIC_URL_GCS + seller.avatar
                          : "/image/header/carbon_user-avatar-filled-alt.svg"
                      }
                      alt={seller.full_name}
                      width={80}
                      height={80}
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <h3>{seller.full_name}</h3>
                    <p>
                      <Icon icon="mdi:email" width={18} height={18} />
                      {seller.email}
                    </p>
                    {seller.phone && (
                      <p>
                        <Icon icon="mdi:phone" width={18} height={18} />
                        {seller.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icon icon="mdi:credit-card-outline" width={24} height={24} />
              Thông tin thanh toán
            </h2>
            <div className={styles.paymentCard}>
              <div className={styles.paymentRow}>
                <span>Phương thức thanh toán:</span>
                <strong>{transaction.payment_method}</strong>
              </div>
              <div className={styles.paymentRow}>
                <span>Trạng thái thanh toán:</span>
                <strong
                  className={
                    styles[
                      `payment${transaction.payment_status.charAt(0).toUpperCase() + transaction.payment_status.slice(1)}`
                    ]
                  }
                >
                  {transaction.payment_status === "paid"
                    ? "Đã thanh toán"
                    : transaction.payment_status === "pending"
                      ? "Chờ thanh toán"
                      : transaction.payment_status === "refunded"
                        ? "Đã hoàn tiền"
                        : "Thất bại"}
                </strong>
              </div>
              <div className={styles.paymentRow}>
                <span>Số tiền:</span>
                <strong className={styles.amount}>
                  {formatPrice(transaction.amount)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactionDetailPage;
