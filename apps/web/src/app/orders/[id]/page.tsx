"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Icon } from "@iconify/react";
import type { Transaction } from "@repo/types";
import styles from "./orderDetail.module.scss";
import { useToast } from "@/components/ui/toast/ToastContext";
import { io, Socket } from "socket.io-client";

const OrderDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [user, setUser] = useState<{ _id: string; full_name: string } | null>(
    null
  );
  const [order, setOrder] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8080/api/transactions/${orderId}/detail`
      );

      setOrder(response.data.data);
    } catch (error) {
      console.error("Error fetching order detail:", error);
      addToast({ type: "error", message: "Không thể tải thông tin đơn hàng" });
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  }, [orderId, addToast, router]);

  useEffect(() => {
    if (user) fetchOrderDetail();
  }, [user, fetchOrderDetail]);

  // Xử lý gửi hàng
  const handleShipOrder = async () => {
    try {
      await axios.post(
        `http://localhost:8080/api/transactions/${orderId}/ship`
      );
      addToast({
        type: "success",
         message: "Đã xác nhận gửi hàng",
         });
       console.log('oder:',order)
      await handleSendNotificationShip();
      await new Promise(resolve => setTimeout(resolve, 5000));
      await handlerSendNotificationComplete();
      // refresh detail so UI shows 'shipping' while backend completes
      fetchOrderDetail();
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

 //Gửi thông báo
 const handleSendNotificationShip = async () => {
  if (!order || !order.post_id || !user?._id) {
    console.warn("Thiếu dữ liệu khi gửi thông báo vận chuyển", order);
    return;
  }

  try {
    await axios.post("http://localhost:8080/api/notifications", {      
      receiver_id: order.buyer_id._id, 
      sender_id: user._id,
      title: "Đơn hàng của bạn đang được vận chuyển",
      body: `Đơn hàng ${order.post_id.title} sắp đến, vui lòng chuẩn bị nhận hàng.`,
      type: "transaction",
      related_id: order._id,
      related_model: "Transaction",
      deeplink: `/transactions/${order._id}`, 
      channel: "in_app",
      is_read: false,
    });

      // socket?.emit("join_user",  order.buyer_id._id, );
      socket?.emit("send_message", {
          receiverId: order.buyer_id._id, 
          message:'Notification'
    });

    console.log("✅ Gửi thông báo thành công cho người bán");
  } catch (error) {
    console.error("❌ Gửi thông báo cho người bán thất bại:", error);
    alert("Gửi thông báo cho người bán thất bại");
  }
};


    const handlerSendNotificationComplete = async ()=>{
       if (!order || !order.post_id || !user?._id) {
        console.warn("Thiếu dữ liệu khi gửi thông báo vận chuyển", order);
        return;
      }
      try {
         await axios.post("http://localhost:8080/api/notifications", {      
          receiver_id: order.buyer_id._id, 
          sender_id: user._id,
          title: "Đơn hàng đã hoàn tất",
          body: `Đơn hàng ${order.post_id.title} đã được giao`,
          type: "transaction",
          related_id: order._id,
          related_model:"Transaction",
          deeplink: "",
          channel: "in_app",
          is_read: false
        });

          // socket?.emit("join_user",  order.buyer_id._id, );
          socket?.emit("send_message", {
              receiverId: order.buyer_id._id, 
              message:'Notification'
        });
      } catch (error) {
        alert('Gửi thông báo cho người mua thất bại')
      }
    }

     const handleSendNotificationCancel = async (order: Transaction, cancelReason: string) => {
        if (!order || !order.post_id || !user?._id) {
          console.warn("Thiếu dữ liệu khi gửi thông báo huỷ đơn", order);
          return;
        }
        try {
          await axios.post("http://localhost:8080/api/notifications", {      
            receiver_id: order.buyer_id._id, 
            sender_id: user._id,
            title: "Đơn hàng của đã bị từ chối",
            body: `Bạn được hoàn lại ${formatPrice(order.amount)} vào tài khoản.\nLý do: ${cancelReason}`,
            type: "transaction",
            related_id: order._id,
            related_model: "Transaction",
            deeplink: `/transactions/${order._id}`, 
            channel: "in_app",
            is_read: false,
          });

            // socket?.emit("join_user",  order.buyer_id._id, );
              socket?.emit("send_message", {
                  receiverId: order.buyer_id._id, 
                  message:'Notification'
              });

          console.log("✅ Gửi thông báo thành công cho người bán");
        } catch (error) {
          console.error("❌ Gửi thông báo cho người bán thất bại:", error);
          alert("Gửi thông báo cho người bán thất bại");
        }
      };


  // Xử lý huỷ đơn
  const handleCancelOrder = async (order : Transaction) => {
    const cancelReason = prompt("Nhập lý do huỷ đơn:");
    if (!cancelReason) return;

    try {
      await axios.post(
        `http://localhost:8080/api/transactions/${orderId}/cancel`,
        { cancelReason }
      );

      //Gửi thông báo
      handleSendNotificationCancel(order,cancelReason);

      await axios.patch(
        `http://localhost:8080/api/posts/${order.post_id._id}`,
        { status: "active" }
      );
      addToast({ type: "success", message: "Đã huỷ đơn và hoàn tiền" });
      fetchOrderDetail();
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  // Xử lý hoàn thành (dành cho người mua)
  const handleCompleteOrder = async () => {
    if (!confirm("Bạn đã nhận được hàng và xác nhận hoàn thành đơn hàng?"))
      return;

    try {
      await axios.post(
        `http://localhost:8080/api/transactions/${orderId}/complete`
      );
      addToast({ type: "success", message: "Đã hoàn thành đơn hàng" });
      fetchOrderDetail();
    } catch (error: any) {
      addToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<
      string,
      { text: string; className: string; icon: string }
    > = {
      pending: {
        text: "Chờ xử lý",
        className: styles.badgePending,
        icon: "mdi:clock-outline",
      },
      shipping: {
        text: "Đang giao",
        className: styles.badgeShipping,
        icon: "mdi:truck-delivery",
      },
      completed: {
        text: "Hoàn thành",
        className: styles.badgeCompleted,
        icon: "mdi:check-circle",
      },
      cancelled: {
        text: "Đã huỷ",
        className: styles.badgeCancelled,
        icon: "mdi:close-circle",
      },
    };
    return badges[status] || badges.pending;
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<
      string,
      { text: string; className: string; icon: string }
    > = {
      pending: {
        text: "Chờ thanh toán",
        className: styles.paymentPending,
        icon: "mdi:clock-outline",
      },
      paid: {
        text: "Đã thanh toán",
        className: styles.paymentPaid,
        icon: "mdi:check-circle",
      },
      failed: {
        text: "Thất bại",
        className: styles.paymentFailed,
        icon: "mdi:close-circle",
      },
      refunded: {
        text: "Đã hoàn tiền",
        className: styles.paymentRefunded,
        icon: "mdi:cash-refund",
      },
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
      second: "2-digit",
    }).format(new Date(date));
  };

  if (loading || !order) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  const post = typeof order.post_id === "object" ? order.post_id : null;
  const seller = typeof order.seller_id === "object" ? order.seller_id : null;
  const buyer = typeof order.buyer_id === "object" ? order.buyer_id : null;
  const statusBadge = getStatusBadge(order.status);
  const paymentBadge = getPaymentStatusBadge(order.payment_status);

  const isSeller =
    user?._id ===
    (typeof order.seller_id === "string" ? order.seller_id : seller?._id);
  const isBuyer =
    user?._id ===
    (typeof order.buyer_id === "string" ? order.buyer_id : buyer?._id);

  return (
    <div className={styles.orderDetailPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => router.push("/orders")}
          >
            <Icon icon="mdi:arrow-left" width={24} height={24} />
            Quay lại
          </button>
          <h1 className={styles.title}>Chi tiết đơn hàng</h1>
        </div>

        {/* Order Status */}
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <Icon icon={statusBadge.icon} width={32} height={32} />
            <div>
              <h2>Trạng thái đơn hàng</h2>
              <span className={statusBadge.className}>{statusBadge.text}</span>
            </div>
          </div>
          <div className={styles.statusTimeline}>
            <div
              className={`${styles.timelineItem} ${
                order.status !== "cancelled" ? styles.active : ""
              }`}
            >
              <div className={styles.timelineIcon}>
                <Icon icon="mdi:check-circle" width={24} height={24} />
              </div>
              <div className={styles.timelineContent}>
                <h4>Đơn hàng đã tạo</h4>
                <p>{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {order.status !== "cancelled" && (
              <>
                <div
                  className={`${styles.timelineItem} ${
                    order.status === "shipping" || order.status === "completed"
                      ? styles.active
                      : ""
                  }`}
                >
                  <div className={styles.timelineIcon}>
                    <Icon icon="mdi:truck-delivery" width={24} height={24} />
                  </div>
                  <div className={styles.timelineContent}>
                    <h4>Đang giao hàng</h4>
                    <p>
                      {order.status === "shipping" ||
                      order.status === "completed"
                        ? formatDate(order.updatedAt)
                        : "Chờ xác nhận"}
                    </p>
                  </div>
                </div>

                <div
                  className={`${styles.timelineItem} ${
                    order.status === "completed" ? styles.active : ""
                  }`}
                >
                  <div className={styles.timelineIcon}>
                    <Icon icon="mdi:package-check" width={24} height={24} />
                  </div>
                  <div className={styles.timelineContent}>
                    <h4>Đã hoàn thành</h4>
                    <p>
                      {order.status === "completed"
                        ? formatDate(order.updatedAt)
                        : "Chờ xác nhận"}
                    </p>
                  </div>
                </div>
              </>
            )}

            {order.status === "cancelled" && (
              <div className={`${styles.timelineItem} ${styles.active}`}>
                <div className={styles.timelineIcon}>
                  <Icon icon="mdi:close-circle" width={24} height={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h4>Đã huỷ</h4>
                  <p>{formatDate(order.updatedAt)}</p>
                  {order.cancel_reason && (
                    <p className={styles.cancelReason}>
                      Lý do: {order.cancel_reason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.mainContent}>
          {/* Product Info */}
          {post && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <Icon icon="mdi:package-variant" width={24} height={24} />
                Thông tin sản phẩm
              </h3>
              <div className={styles.productCard}>
                <div className={styles.productGallery}>
                  <Image
                    src={
                      post.images?.[0]?.url
                        ? process.env.NEXT_PUBLIC_URL_GCS + post.images[0].url
                        : "/image/placeholder.png"
                    }
                    alt={post.title}
                    width={300}
                    height={300}
                    className={styles.mainImage}
                  />
                  {post.images && post.images.length > 1 && (
                    <div className={styles.thumbnails}>
                      {post.images.slice(0, 4).map((img, idx) => (
                        <Image
                          key={idx}
                          src={process.env.NEXT_PUBLIC_URL_GCS + img.url}
                          alt={img.alt || post.title}
                          width={80}
                          height={80}
                          className={styles.thumbnail}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <h2 className={styles.productTitle}>{post.title}</h2>
                  {post.description && (
                    <p className={styles.productDescription}>
                      {post.description}
                    </p>
                  )}
                  <div className={styles.productMeta}>
                    <div className={styles.metaItem}>
                      <Icon icon="mdi:tag" width={20} height={20} />
                      <span>Loại: {post.transaction_type}</span>
                    </div>
                    {post.condition && (
                      <div className={styles.metaItem}>
                        <Icon icon="mdi:star" width={20} height={20} />
                        <span>Tình trạng: {post.condition}</span>
                      </div>
                    )}
                    {post.location && (
                      <div className={styles.metaItem}>
                        <Icon icon="mdi:map-marker" width={20} height={20} />
                        <span>
                          {post.location.province || post.location.address}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.productPrice}>
                    {formatPrice(order.amount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Icon icon="mdi:credit-card" width={24} height={24} />
              Thông tin thanh toán
            </h3>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mã giao dịch:</span>
                <span className={styles.infoValue}>
                  {order.transaction_ref}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Số tiền:</span>
                <span className={styles.infoValueHighlight}>
                  {formatPrice(order.amount)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phương thức:</span>
                <span className={styles.infoValue}>
                  {order.payment_method} ({order.payment_gateway})
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Trạng thái thanh toán:</span>
                <span className={paymentBadge.className}>
                  <Icon icon={paymentBadge.icon} width={16} height={16} />
                  {paymentBadge.text}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Thời gian tạo:</span>
                <span className={styles.infoValue}>
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Cập nhật lần cuối:</span>
                <span className={styles.infoValue}>
                  {formatDate(order.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Seller & Buyer Info */}
          <div className={styles.peopleSection}>
            {seller && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon icon="mdi:store" width={24} height={24} />
                  Thông tin người bán
                </h3>
                <div className={styles.personCard}>
                  <Image
                    src={
                      seller.avatar
                        ? process.env.NEXT_PUBLIC_URL_GCS + seller.avatar
                        : "/image/header/carbon_user-avatar-filled-alt.svg"
                    }
                    alt={seller.full_name}
                    width={80}
                    height={80}
                    className={styles.avatar}
                  />
                  <div className={styles.personInfo}>
                    <h4 className={styles.personName}>{seller.full_name}</h4>
                    <p className={styles.personContact}>
                      <Icon icon="mdi:email" width={18} height={18} />
                      {seller.email}
                    </p>
                    {seller.phone && (
                      <p className={styles.personContact}>
                        <Icon icon="mdi:phone" width={18} height={18} />
                        {seller.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {buyer && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon icon="mdi:account" width={24} height={24} />
                  Thông tin người mua
                </h3>
                <div className={styles.personCard}>
                  <Image
                    src={
                      buyer.avatar
                        ? process.env.NEXT_PUBLIC_URL_GCS + buyer.avatar
                        : "/image/header/carbon_user-avatar-filled-alt.svg"
                    }
                    alt={buyer.full_name}
                    width={80}
                    height={80}
                    className={styles.avatar}
                  />
                  <div className={styles.personInfo}>
                    <h4 className={styles.personName}>{buyer.full_name}</h4>
                    <p className={styles.personContact}>
                      <Icon icon="mdi:email" width={18} height={18} />
                      {buyer.email}
                    </p>
                    {buyer.phone && (
                      <p className={styles.personContact}>
                        <Icon icon="mdi:phone" width={18} height={18} />
                        {buyer.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsCard}>
          {isSeller && order.status === "pending" && (
            <>
              <button className={styles.btnShip} onClick={handleShipOrder}>
                <Icon icon="mdi:truck-delivery" width={20} height={20} />
                Xác nhận gửi hàng
              </button>
              <button className={styles.btnCancel} onClick={() => handleCancelOrder(order)}>
                <Icon icon="mdi:close-circle" width={20} height={20} />
                Huỷ đơn hàng
              </button>
            </>
          )}

          {isBuyer && order.status === "shipping" && (
            <button
              className={styles.btnComplete}
              onClick={handleCompleteOrder}
            >
              <Icon icon="mdi:check-circle" width={20} height={20} />
              Xác nhận đã nhận hàng
            </button>
          )}

          {order.status === "completed" && (
            <div className={styles.completedMessage}>
              <Icon icon="mdi:check-circle" width={32} height={32} />
              <p>Đơn hàng đã hoàn thành</p>
            </div>
          )}

          {order.status === "cancelled" && (
            <div className={styles.cancelledMessage}>
              <Icon icon="mdi:close-circle" width={32} height={32} />
              <p>Đơn hàng đã bị huỷ</p>
              {order.cancel_reason && (
                <p className={styles.reason}>Lý do: {order.cancel_reason}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;