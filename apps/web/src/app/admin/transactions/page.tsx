"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/api-client";
import Image from "next/image";
import { formatImageUrl } from "@/lib/constants";
import { Icon } from "@iconify/react";
import type { Transaction } from "@repo/types";
import styles from "./transactions.module.scss";
import { useToast } from "@/components/ui/toast/ToastContext";
import { API_BASE } from "@/lib/constants";

type TabType = "all" | "pending" | "shipping" | "completed" | "cancelled";

interface Statistics {
  total: number;
  pending: number;
  shipping: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

const AdminTransactionsPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<{
    _id: string;
    full_name: string;
    role: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const revenueRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();

  // Load user từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role !== "admin") {
        router.push("/");
        return;
      }
      setUser(userData);
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/transactions/admin/statistics`
      );
      setStatistics(response.data.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (status?: string) => {
      if (!user) return;

      setLoading(true);
      try {
        const url =
          status && status !== "all"
            ? `${API_BASE}/api/transactions/admin/all?status=${status}`
            : `${API_BASE}/api/transactions/admin/all`;

        const response = await axios.get(url);
        setTransactions(response.data.data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
        addToast({ type: "error", message: "Lỗi khi tải danh sách giao dịch" });
      } finally {
        setLoading(false);
      }
    },
    [user, addToast]
  );

  useEffect(() => {
    if (user) {
      fetchTransactions(activeTab === "all" ? undefined : activeTab);
      fetchStatistics();
    }
  }, [user, activeTab, fetchTransactions, fetchStatistics]);

  // Check if revenue value overflows its container and toggle expanded layout
  useEffect(() => {
    const checkOverflow = () => {
      const el = revenueRef.current;
      if (!el) return;
      // if content width > container width, enable expanded layout
      const isOverflowing = el.scrollWidth > el.clientWidth;
      setStatsExpanded(isOverflowing);
    };

    // run after statistics is set
    checkOverflow();
    // re-check on window resize
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [statistics]);

  // Xử lý cập nhật trạng thái
  const handleUpdateStatus = async (
    transactionId: string,
    newStatus: string
  ) => {
    const note =
      newStatus === "cancelled"
        ? prompt("Nhập lý do huỷ (tùy chọn):")
        : undefined;

    try {
      await axios.patch(
        `${API_BASE}/api/transactions/admin/${transactionId}/status`,
        { status: newStatus, note }
      );
      addToast({
        type: "success",
        message: `Đã cập nhật trạng thái giao dịch thành công`,
      });
      fetchTransactions(activeTab === "all" ? undefined : activeTab);
      fetchStatistics();
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  // Xem chi tiết giao dịch
  const handleViewDetail = (transactionId: string) => {
    router.push(`/admin/transactions/${transactionId}`);
  };

  // Xem người dùng
  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  // Xem bài đăng
  const handleViewPost = (postId: string) => {
    router.push(`/post/${postId}`);
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: "Chờ xử lý", className: styles.badgePending },
      shipping: { text: "Đang giao", className: styles.badgeShipping },
      completed: { text: "Hoàn thành", className: styles.badgeCompleted },
      cancelled: { text: "Đã huỷ", className: styles.badgeCancelled },
    };
    return badges[status] || badges.pending;
  };

  // Get payment status badge
  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      pending: { text: "Chờ thanh toán", className: styles.paymentPending },
      paid: { text: "Đã thanh toán", className: styles.paymentPaid },
      failed: { text: "Thất bại", className: styles.paymentFailed },
      refunded: { text: "Đã hoàn tiền", className: styles.paymentRefunded },
    };
    return badges[status] || badges.pending;
  };

  // Filter transactions by search query
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const post =
      typeof transaction.post_id === "object" ? transaction.post_id : null;
    const buyer =
      typeof transaction.buyer_id === "object" ? transaction.buyer_id : null;
    const seller =
      typeof transaction.seller_id === "object" ? transaction.seller_id : null;

    return (
      transaction.transaction_ref.toLowerCase().includes(query) ||
      post?.title?.toLowerCase().includes(query) ||
      buyer?.full_name?.toLowerCase().includes(query) ||
      buyer?.email?.toLowerCase().includes(query) ||
      seller?.full_name?.toLowerCase().includes(query) ||
      seller?.email?.toLowerCase().includes(query)
    );
  });

  if (!user || user.role !== "admin") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminTransactionsPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <Icon icon="mdi:cash-multiple" width={40} height={40} />
              Quản lý giao dịch
            </h1>
          </div>
          <button
            className={styles.refreshBtn}
            onClick={() => {
              fetchTransactions(activeTab === "all" ? undefined : activeTab);
              fetchStatistics();
            }}
          >
            <Icon icon="mdi:refresh" width={20} height={20} />
            Làm mới
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div
            className={`${styles.statisticsGrid} ${statsExpanded ? styles.statisticsExpanded : ""}`}
          >
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
                <Icon icon="mdi:cash-multiple" width={32} height={32} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Tổng giao dịch</div>
                <div className={styles.statValue}>{statistics.total}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPending}`}>
                <Icon icon="mdi:clock-outline" width={32} height={32} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Chờ xử lý</div>
                <div className={styles.statValue}>{statistics.pending}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconShipping}`}>
                <Icon icon="mdi:truck-delivery" width={32} height={32} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Đang giao</div>
                <div className={styles.statValue}>{statistics.shipping}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconCompleted}`}>
                <Icon icon="mdi:check-circle" width={32} height={32} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Hoàn thành</div>
                <div className={styles.statValue}>{statistics.completed}</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconCancelled}`}>
                <Icon icon="mdi:close-circle" width={32} height={32} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Đã huỷ</div>
                <div className={styles.statValue}>{statistics.cancelled}</div>
              </div>
            </div>

            <div
              className={`${styles.statCard} ${styles.statCardRevenue} ${statsExpanded ? styles.statCardWide : ""}`}
            >
              <div className={`${styles.statIcon} ${styles.statIconRevenue}`}>
                <Icon icon="mdi:chart-line" width={32} height={32} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Tổng doanh thu</div>
                <div className={styles.statValue} ref={revenueRef}>
                  {formatPrice(statistics.totalRevenue)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <Icon
            icon="mdi:magnify"
            width={20}
            height={20}
            className={styles.searchIcon}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã giao dịch, tên sản phẩm, người mua, người bán..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearchQuery("")}
              title="Xóa tìm kiếm"
            >
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <Icon icon="mdi:all-inclusive" width={20} height={20} />
            <span>Tất cả</span>
            {statistics && (
              <span className={styles.tabCount}>{statistics.total}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "pending" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            <Icon icon="mdi:clock-outline" width={20} height={20} />
            <span>Chờ xử lý</span>
            {statistics && (
              <span className={styles.tabCount}>{statistics.pending}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "shipping" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("shipping")}
          >
            <Icon icon="mdi:truck-delivery" width={20} height={20} />
            <span>Đang giao</span>
            {statistics && (
              <span className={styles.tabCount}>{statistics.shipping}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "completed" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            <Icon icon="mdi:check-circle" width={20} height={20} />
            <span>Hoàn thành</span>
            {statistics && (
              <span className={styles.tabCount}>{statistics.completed}</span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "cancelled" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            <Icon icon="mdi:close-circle" width={20} height={20} />
            <span>Đã huỷ</span>
            {statistics && (
              <span className={styles.tabCount}>{statistics.cancelled}</span>
            )}
          </button>
        </div>

        {/* Transactions List */}
        <div className={styles.transactionsList}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Đang tải giao dịch...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon icon="mdi:cash-multiple" width={80} height={80} />
              <h3>Không có giao dịch</h3>
              <p>
                {searchQuery
                  ? "Không tìm thấy giao dịch nào khớp với từ khóa tìm kiếm"
                  : "Chưa có giao dịch nào trong danh mục này"}
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const post =
                typeof transaction.post_id === "object"
                  ? transaction.post_id
                  : null;
              const buyer =
                typeof transaction.buyer_id === "object"
                  ? transaction.buyer_id
                  : null;
              const seller =
                typeof transaction.seller_id === "object"
                  ? transaction.seller_id
                  : null;
              const statusBadge = getStatusBadge(transaction.status);
              const paymentBadge = getPaymentBadge(transaction.payment_status);

              return (
                <div key={transaction._id} className={styles.transactionCard}>
                  <div className={styles.transactionHeader}>
                    <div className={styles.transactionInfo}>
                      <span className={styles.transactionId}>
                        <Icon icon="mdi:barcode" width={18} height={18} />
                        {transaction.transaction_ref}
                      </span>
                      <span className={styles.transactionDate}>
                        <Icon icon="mdi:calendar" width={16} height={16} />
                        {formatDate(transaction.createdAt)}
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

                  <div className={styles.transactionBody}>
                    <div className={styles.transactionRow}>
                      {/* Product Info */}
                      {post && (
                        <div className={styles.productSection}>
                          <h4 className={styles.sectionTitle}>
                            <Icon
                              icon="mdi:package-variant"
                              width={18}
                              height={18}
                            />
                            Sản phẩm
                          </h4>
                          <div className={styles.productInfo}>
                            <div className={styles.productImage}>
                              <Image
                                src={
                                  post.images?.[0]?.url
                                    ? formatImageUrl(post.images[0].url) ||
                                      "/image/placeholder.png"
                                    : "/image/placeholder.png"
                                }
                                alt={post.title}
                                width={80}
                                height={80}
                                className={styles.thumbnail}
                              />
                            </div>
                            <div className={styles.productDetails}>
                              <h3 className={styles.productTitle}>
                                {post.title}
                              </h3>
                              <p className={styles.productPrice}>
                                {formatPrice(transaction.amount)}
                              </p>
                              <div className={styles.productMeta}>
                                <span>
                                  <Icon
                                    icon="mdi:swap-horizontal"
                                    width={16}
                                    height={16}
                                  />
                                  {post.transaction_type === "exchange"
                                    ? "Trao đổi"
                                    : "Thanh lý"}
                                </span>
                              </div>
                              <button
                                className={styles.linkBtn}
                                onClick={() =>
                                  post._id && handleViewPost(post._id)
                                }
                              >
                                <Icon icon="mdi:eye" width={16} height={16} />
                                Xem bài đăng
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Buyer Info */}
                      {buyer && (
                        <div className={styles.userSection}>
                          <h4 className={styles.sectionTitle}>
                            <Icon
                              icon="mdi:account-cash"
                              width={18}
                              height={18}
                            />
                            Người mua
                          </h4>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                              <Image
                                src={
                                  buyer.avatar
                                    ? formatImageUrl(buyer.avatar) ||
                                      "/image/header/carbon_user-avatar-filled-alt.svg"
                                    : "/image/header/carbon_user-avatar-filled-alt.svg"
                                }
                                alt={buyer.full_name}
                                width={50}
                                height={50}
                              />
                            </div>
                            <div className={styles.userDetails}>
                              <p className={styles.userName}>
                                {buyer.full_name}
                              </p>
                              <p className={styles.userContact}>
                                <Icon icon="mdi:email" width={14} height={14} />
                                {buyer.email}
                              </p>
                              {buyer.phone && (
                                <p className={styles.userContact}>
                                  <Icon
                                    icon="mdi:phone"
                                    width={14}
                                    height={14}
                                  />
                                  {buyer.phone}
                                </p>
                              )}
                              <button
                                className={styles.linkBtn}
                                onClick={() =>
                                  buyer._id && handleViewUser(buyer._id)
                                }
                              >
                                <Icon
                                  icon="mdi:account-details"
                                  width={16}
                                  height={16}
                                />
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Seller Info */}
                      {seller && (
                        <div className={styles.userSection}>
                          <h4 className={styles.sectionTitle}>
                            <Icon icon="mdi:store" width={18} height={18} />
                            Người bán
                          </h4>
                          <div className={styles.userInfo}>
                            <div className={styles.userAvatar}>
                              <Image
                                src={
                                  seller.avatar
                                    ? formatImageUrl(seller.avatar) ||
                                      "/image/header/carbon_user-avatar-filled-alt.svg"
                                    : "/image/header/carbon_user-avatar-filled-alt.svg"
                                }
                                alt={seller.full_name}
                                width={50}
                                height={50}
                              />
                            </div>
                            <div className={styles.userDetails}>
                              <p className={styles.userName}>
                                {seller.full_name}
                              </p>
                              <p className={styles.userContact}>
                                <Icon icon="mdi:email" width={14} height={14} />
                                {seller.email}
                              </p>
                              {seller.phone && (
                                <p className={styles.userContact}>
                                  <Icon
                                    icon="mdi:phone"
                                    width={14}
                                    height={14}
                                  />
                                  {seller.phone}
                                </p>
                              )}
                              <button
                                className={styles.linkBtn}
                                onClick={() =>
                                  seller._id && handleViewUser(seller._id)
                                }
                              >
                                <Icon
                                  icon="mdi:account-details"
                                  width={16}
                                  height={16}
                                />
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentItem}>
                        <Icon icon="mdi:credit-card" width={18} height={18} />
                        <span>Phương thức: {transaction.payment_method}</span>
                      </div>
                      <div className={styles.paymentItem}>
                        <Icon icon="mdi:cash" width={18} height={18} />
                        <span>Số tiền: {formatPrice(transaction.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.transactionActions}>
                    <button
                      className={styles.btnDetail}
                      onClick={() => handleViewDetail(transaction._id)}
                    >
                      <Icon icon="mdi:eye" width={18} height={18} />
                      Chi tiết
                    </button>

                    {transaction.status === "pending" && (
                      <>
                        <button
                          className={styles.btnShip}
                          onClick={() =>
                            handleUpdateStatus(transaction._id, "shipping")
                          }
                        >
                          <Icon
                            icon="mdi:truck-delivery"
                            width={18}
                            height={18}
                          />
                          Giao hàng
                        </button>
                        <button
                          className={styles.btnCancel}
                          onClick={() =>
                            handleUpdateStatus(transaction._id, "cancelled")
                          }
                        >
                          <Icon
                            icon="mdi:close-circle"
                            width={18}
                            height={18}
                          />
                          Huỷ
                        </button>
                      </>
                    )}

                    {transaction.status === "shipping" && (
                      <button
                        className={styles.btnComplete}
                        onClick={() =>
                          handleUpdateStatus(transaction._id, "completed")
                        }
                      >
                        <Icon icon="mdi:check-circle" width={18} height={18} />
                        Hoàn thành
                      </button>
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

export default AdminTransactionsPage;
