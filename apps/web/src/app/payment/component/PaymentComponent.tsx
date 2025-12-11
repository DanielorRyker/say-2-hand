/* eslint-disable @next/next/no-img-element */
"use client";
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import axios from "axios";
import Link from "next/link";
import styles from "../payment.module.scss";
import { Icon } from "@iconify/react";
import { io, Socket } from "socket.io-client";
import { API_BASE } from "@/lib/constants";
// import axios from "axios"; // TODO: Sẽ dùng khi backend có endpoint /api/payments

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface PaymentComponentProps {
  postData: any;
  currentUser: any;
  onBack: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "momo",
    name: "Momo",
    icon: "arcticons:momo",
    color: "#a50064",
    description: "Ví điện tử Momo - Thanh toán nhanh chóng",
  },
  {
    id: "zalopay",
    name: "ZaloPay",
    icon: "simple-icons:zalo",
    color: "#0068ff",
    description: "Ví điện tử ZaloPay - An toàn bảo mật",
  },
  {
    id: "vnpay",
    name: "VNPay",
    icon: "arcticons:v-vnpay",
    color: "#da251d",
    description: "VNPay - Cổng thanh toán quốc gia",
  },
  {
    id: "bank",
    name: "Chuyển khoản",
    icon: "mdi:bank",
    color: "#10b981",
    description: "Chuyển khoản ngân hàng trực tiếp",
  },
];

// Helper to create ripple effect
export function createRipple(
  e: React.MouseEvent | MouseEvent,
  btn?: HTMLElement
) {
  try {
    const ev = e as MouseEvent;
    let targetBtn: HTMLElement | null = null;
    if (btn) targetBtn = btn;
    else if ((e as React.MouseEvent).currentTarget)
      targetBtn = (e as React.MouseEvent).currentTarget as HTMLElement;
    else if ((e as any).target)
      targetBtn = ((e as any).target as HTMLElement).closest
        ? ((e as any).target as HTMLElement).closest("button")
        : null;
    if (!targetBtn) return;
    const existing = targetBtn.querySelector(`.${styles["ripple-span"]}`);
    if (existing) existing.remove();
    const rect = targetBtn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = styles["ripple-span"] || "ripple-span";
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    const clientX =
      ev && typeof ev.clientX === "number"
        ? ev.clientX
        : rect.left + rect.width / 2;
    const clientY =
      ev && typeof ev.clientY === "number"
        ? ev.clientY
        : rect.top + rect.height / 2;
    ripple.style.left = `${clientX - rect.left - size / 2}px`;
    ripple.style.top = `${clientY - rect.top - size / 2}px`;
    targetBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  } catch {
    // swallow errors—non-critical UI effect
  }
}

const PaymentComponent: React.FC<PaymentComponentProps> = ({
  postData,
  currentUser,
  onBack,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  //QR
  const [qrURL, setQrURL] = useState<string | undefined>(undefined);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // QR payment flow
  const [qrLoading, setQrLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  //  Ẩn popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current && popupRef.current.contains(target)) return;
      if (overlayRef.current && overlayRef.current.contains(target)) return;
      setQrModalOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (qrModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [qrModalOpen]);

  //countdown
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!qrModalOpen) return; // chỉ chạy khi popup mở

    // reset lại khi popup mở
    setCountdown(10);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQrModalOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer); // dọn dẹp khi đóng popup
  }, [qrModalOpen]);

  // Address states
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<
    number | null
  >(0);
  const [customAddress, setCustomAddress] = useState("");
  const [saveCustomAddress, setSaveCustomAddress] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  //Socket
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    // Kết nối socket.io tới BE (NestJS WebSocketGateway)
    const newSocket = io(`${API_BASE}`, {
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

  // Normalize data structure (handle both API and cache formats)
  const normalizedPost = React.useMemo(() => {
    if (!postData) return null;
    return {
      _id: postData._id || postData.post_id,
      title: postData.title,
      price: postData.price || 0,
      condition: postData.condition || "used",
      transaction_type: postData.transaction_type || "sell",
      images: postData.images || [],
      location: postData.location || { address: "Việt Nam" },
      author_id: postData.author_id || { full_name: "Người bán" },
    };
  }, [postData]);

  // Set payment method to 'free' if transaction_type is "give away"
  useEffect(() => {
    if (normalizedPost?.transaction_type === "give away") {
      setSelectedMethod("free");
    }
  }, [normalizedPost?.transaction_type]);

  // Extract user's saved addresses from currentUser
  const savedAddresses = useMemo(() => {
    if (!currentUser) return [];
    return currentUser.addresses || [];
  }, [currentUser]);

  const handlePayment = useCallback(async () => {
    if (processing) return; // Đã bấm rồi thì không cho bấm tiếp
    if (!normalizedPost) return;
    if (!selectedMethod) {
      alert("Vui lòng chọn phương thức thanh toán!");
      return;
    }
    if (!agreeTerms) {
      alert("Vui lòng đồng ý với điều khoản thanh toán!");
      return;
    }
    setProcessing(true);
    try {
      console.log("💳 Processing payment...", {
        method: selectedMethod,
        amount: normalizedPost.price,
        postId: normalizedPost._id,
      });
      // Simulate payment processing (2s delay)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await axios.patch(`${API_BASE}/api/posts/${normalizedPost._id}`, {
        status: "shipping",
      });
      const res = await axios.post(`${API_BASE}/api/transactions`, {
        post_id: normalizedPost._id,
        seller_id: normalizedPost.author_id?._id || normalizedPost.author_id,
        buyer_id: currentUser._id,
        amount: normalizedPost.price,
        currency: "VND",
        payment_gateway: "vnpay",
        payment_method: selectedMethod,
        payment_status: "paid",
        transaction_ref: "VNPAY202510200002",
        status: "pending",
      });
      const transactionData = {
        transactionId: res.data.data.transaction_ref,
        postId: normalizedPost._id,
        postTitle: normalizedPost.title,
        amount: normalizedPost.price,
        serviceFee: Math.round(normalizedPost.price * 0.03),
        totalAmount:
          normalizedPost.price + Math.round(normalizedPost.price * 0.03),
        paymentMethod: selectedMethod,
        timestamp: new Date().toISOString(),
        seller: {
          id: normalizedPost.author_id?._id || normalizedPost.author_id,
          name: normalizedPost.author_id?.username || "Người bán",
        },
      };
      sessionStorage.setItem(
        "lastTransaction",
        JSON.stringify(transactionData)
      );

      let titleNotification = "";
      let bodyNotification = "";
      if (selectedMethod == "free") {
        titleNotification = "Có người nhận món đồ của bạn";
        bodyNotification =
          currentUser.full_name +
          " đã nhận sản phẩm " +
          normalizedPost.title +
          " của bạn. Vui lòng xác nhận.";
      } else {
        titleNotification = "Bạn có đơn hàng mới";
        bodyNotification =
          currentUser.full_name +
          " đã mua sản phẩm " +
          normalizedPost.title +
          " từ bạn.";
      }

      await axios.post(`${API_BASE}/api/notifications`, {
        receiver_id: normalizedPost.author_id?._id || normalizedPost.author_id,
        sender_id: currentUser._id,
        title: titleNotification,
        body: bodyNotification,
        type: "transaction",
        related_id: res.data.data._id,
        related_model: "Transaction",
        deeplink: "",
        channel: "in_app",
        is_read: false,
      });

      await axios.post(`${API_BASE}/api/notifications`, {
        receiver_id: currentUser._id,
        sender_id: normalizedPost.author_id?._id || normalizedPost.author_id,
        title: "Mua hàng thành công",
        body:
          "Vui lòng chờ " +
          normalizedPost.author_id?.full_name +
          " xác nhận đơn hàng của bạn.",
        type: "transaction",
        related_id: res.data.data._id,
        related_model: "Transaction",
        deeplink: "",
        channel: "in_app",
        is_read: false,
      });
      socket?.emit("send_message", {
        receiverId: normalizedPost.author_id?._id || normalizedPost.author_id,
        message: "Notification",
      });
      window.location.href = `/payment/success?txn=${transactionData.transactionId}`;
    } catch (error: any) {
      console.error("❌ Payment error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMsg =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      alert(
        `Thanh toán thất bại: ${errorMsg}\n\nVui lòng thử lại hoặc chọn phương thức thanh toán khác.`
      );
    } finally {
      setProcessing(false);
    }
  }, [
    selectedMethod,
    agreeTerms,
    normalizedPost,
    processing,
    currentUser,
    socket,
  ]);

  // Save custom address into user's addresses via backend PATCH
  const patchSaveAddress = async (addressToSave: {
    label?: string;
    address: string;
    is_default?: boolean;
  }) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Chưa đăng nhập");
      // Build payload with _id and addresses
      const user = localStorage.getItem("user");
      const parsed = user ? JSON.parse(user) : null;
      if (!parsed || !parsed._id) throw new Error("User không hợp lệ");
      const updatedAddresses = [...(parsed.addresses || [])];
      if (addressToSave.is_default) {
        updatedAddresses.forEach((a: any) => (a.is_default = false));
      }
      updatedAddresses.push(addressToSave);
      const payload = { _id: parsed._id, addresses: updatedAddresses };
      await axios.patch(`${API_BASE}/api/users/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh localStorage user from server
      const res = await axios.get(
        `${API_BASE}/api/users/find/${parsed.email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.setItem("user", JSON.stringify(res.data));
      // Notify same-tab listeners
      window.dispatchEvent(new Event("user-updated"));
      return true;
    } catch (error) {
      console.error("Lưu địa chỉ thất bại:", error);
      return false;
    }
  };

  if (!postData || !normalizedPost) {
    return (
      <div className={styles["payment-error"]}>
        <Icon icon="mdi:alert-circle" width={48} />
        <p>Không tìm thấy thông tin sản phẩm</p>
      </div>
    );
  }

  const serviceFee = Math.round(normalizedPost.price * 0.03); // 3% service fee
  const totalAmount = normalizedPost.price + serviceFee;

  //QR
  const handleQR = async () => {
    const query = new URLSearchParams({
      accountNo: "2006205431189",
      accountName: normalizedPost.author_id?.full_name,
      amount: normalizedPost.price + Math.round(normalizedPost.price * 0.03),
      addInfo:
        "Thanh toan don hang " +
        normalizedPost.title +
        " gia " +
        normalizedPost.price +
        " vnd",
    }).toString();

    const res = await fetch(`${API_BASE}/api/qr?${query}`);
    if (!res.ok) {
      throw new Error("Failed to generate QR");
    }
    // Assuming the API returns { url: "..." }
    const data = await res.json();
    console.log("query:" + data.qrUrl);
    setQrURL(data.qrUrl);
  };

  return (
    <div>
      <div className={styles["payment-container"]} ref={popupRef}>
        {/* Header */}
        <div className={styles["payment-header"]}>
          <button
            className={styles["back-btn"]}
            onClick={(e) => {
              createRipple(e);
              onBack();
            }}
            title="Quay lại"
            aria-label="Quay lại trang trước"
          >
            <Icon icon="mdi:arrow-left" width={24} />
          </button>
          <h1 className={styles["page-title"]}>Thanh Toán</h1>
        </div>

        <div className={styles["payment-content"]}>
          {/* Product Info */}
          <section className={styles["product-info-section"]}>
            <h2 className={styles["section-title"]}>
              <Icon icon="mdi:package-variant" width={20} />
              Thông tin sản phẩm
            </h2>
            <div className={styles["product-card"]}>
              <img
                src={
                  normalizedPost.images && normalizedPost.images.length > 0
                    ? process.env.NEXT_PUBLIC_URL_GCS +
                      normalizedPost.images[0].url
                    : "https://placehold.co/100x100/9ca3af/ffffff?text=No+Image"
                }
                alt={normalizedPost.title}
                className={styles["product-image"]}
              />
              <div className={styles["product-details"]}>
                <h3 className={styles["product-title"]}>
                  {normalizedPost.title}
                </h3>
                <p className={styles["product-seller"]}>
                  Người bán: {normalizedPost.author_id?.full_name || "Không rõ"}
                </p>
                <div className={styles["product-meta"]}>
                  <span className={styles["condition-badge"]}>
                    {normalizedPost.condition === "new"
                      ? "Mới 100%"
                      : normalizedPost.condition === "like_new"
                        ? "Gần như mới"
                        : "Đã sử dụng"}
                  </span>
                  <span className={styles["location"]}>
                    <Icon icon="mdi:map-marker" width={16} />
                    {normalizedPost.location?.address || "Hà Nội"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Method Selection */}
          {normalizedPost.transaction_type == "sell" ? (
            <section className={styles["payment-method-section"]}>
              <h2 className={styles["section-title"]}>
                <Icon icon="mdi:credit-card" width={20} />
                Chọn phương thức thanh toán
              </h2>
              <div className={styles["payment-methods"]}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    className={`${styles["method-card"]} ${
                      selectedMethod === method.id ? styles["selected"] : ""
                    }`}
                    onClick={(e) => {
                      createRipple(e);
                      setSelectedMethod(method.id);
                    }}
                  >
                    <div className={styles["method-icon"]}>
                      <Icon
                        icon={method.icon}
                        width={32}
                        color={method.color}
                      />
                    </div>
                    <div className={styles["method-info"]}>
                      <h4 className={styles["method-name"]}>{method.name}</h4>
                      <p className={styles["method-desc"]}>
                        {method.description}
                      </p>
                    </div>
                    <div className={styles["method-check"]}>
                      {selectedMethod === method.id && (
                        <Icon
                          icon="mdi:check-circle"
                          width={24}
                          color="#10b981"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div></div>
          )}

          {/* Shipping Address Selection */}
          <section className={styles["address-section"]}>
            <h2 className={styles["section-title"]}>
              <Icon icon="mdi:map-marker" width={20} />
              Địa chỉ giao hàng
            </h2>

            <div className={styles["address-options"]}>
              {/* Saved Addresses */}
              <div className={styles["address-option-group"]}>
                <label className={styles["radio-label"]}>
                  <input
                    type="radio"
                    name="addressType"
                    checked={useSavedAddress}
                    onChange={() => {
                      setUseSavedAddress(true);
                      if (savedAddresses.length > 0) setSelectedAddressIndex(0);
                    }}
                    className={styles["radio-input"]}
                  />
                  <span className={styles["radio-text"]}>
                    <Icon icon="mdi:bookmark-check" width={18} />
                    Sử dụng địa chỉ đã lưu
                  </span>
                </label>

                {useSavedAddress && (
                  <div className={styles["address-cards"]}>
                    {savedAddresses.length === 0 ? (
                      <div className={styles["empty-state"]}>
                        <Icon
                          icon="mdi:map-marker-off"
                          width={40}
                          color="#9ca3af"
                        />
                        <p>Chưa có địa chỉ nào được lưu</p>
                        <button
                          className={styles["add-address-hint"]}
                          onClick={() => setUseSavedAddress(false)}
                        >
                          Thêm địa chỉ mới
                        </button>
                      </div>
                    ) : (
                      savedAddresses.map((addr: any, idx: number) => (
                        <label
                          key={idx}
                          className={`${styles["address-card"]} ${selectedAddressIndex === idx ? styles["selected"] : ""}`}
                          onClick={() => setSelectedAddressIndex(idx)}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            checked={selectedAddressIndex === idx}
                            onChange={() => setSelectedAddressIndex(idx)}
                            className={styles["hidden-radio"]}
                          />
                          <div className={styles["address-card-content"]}>
                            <div className={styles["address-header"]}>
                              <span className={styles["address-label"]}>
                                {addr.label || "Địa chỉ"}
                              </span>
                              {addr.is_default && (
                                <span className={styles["default-badge"]}>
                                  <Icon icon="mdi:star" width={12} />
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className={styles["address-detail"]}>
                              {addr.address}
                            </p>
                          </div>
                          {selectedAddressIndex === idx && (
                            <div className={styles["check-icon"]}>
                              <Icon
                                icon="mdi:check-circle"
                                width={24}
                                color="#10b981"
                              />
                            </div>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* New Address */}
              <div className={styles["address-option-group"]}>
                <label className={styles["radio-label"]}>
                  <input
                    type="radio"
                    name="addressType"
                    checked={!useSavedAddress}
                    onChange={() => setUseSavedAddress(false)}
                    className={styles["radio-input"]}
                  />
                  <span className={styles["radio-text"]}>
                    <Icon icon="mdi:plus-circle" width={18} />
                    Nhập địa chỉ mới
                  </span>
                </label>

                {!useSavedAddress && (
                  <div className={styles["new-address-form"]}>
                    <div className={styles["form-group"]}>
                      <label className={styles["form-label"]}>
                        <Icon icon="mdi:map-marker" width={16} />
                        Địa chỉ chi tiết
                      </label>
                      <input
                        type="text"
                        placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        className={styles["address-input"]}
                      />
                    </div>

                    <label className={styles["checkbox-save"]}>
                      <input
                        type="checkbox"
                        checked={saveCustomAddress}
                        onChange={(e) => setSaveCustomAddress(e.target.checked)}
                        className={styles["checkbox-input"]}
                      />
                      <span className={styles["checkbox-text"]}>
                        <Icon icon="mdi:content-save" width={16} />
                        Lưu địa chỉ này vào danh sách của tôi
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Payment Summary */}
          <section className={styles["payment-summary-section"]}>
            <h2 className={styles["section-title"]}>
              <Icon icon="mdi:receipt" width={20} />
              Chi tiết thanh toán
            </h2>
            <div className={styles["summary-card"]}>
              <div className={styles["summary-row"]}>
                <span className={styles["summary-label"]}>Giá sản phẩm:</span>
                <span className={styles["summary-value"]}>
                  {formatCurrency(normalizedPost.price)}
                </span>
              </div>
              <div className={styles["summary-row"]}>
                <span className={styles["summary-label"]}>
                  Phí dịch vụ (3%):
                </span>
                <span className={styles["summary-value"]}>
                  {formatCurrency(serviceFee)}
                </span>
              </div>
              <div className={styles["summary-divider"]}></div>
              <div className={`${styles["summary-row"]} ${styles["total"]}`}>
                <span className={styles["summary-label"]}>Tổng cộng:</span>
                <span className={styles["summary-value"]}>
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </section>

          {/* Terms and Conditions */}
          <section className={styles["terms-section"]}>
            <label className={styles["checkbox-label"]}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className={styles["checkbox-input"]}
              />
              <span className={styles["checkbox-text"]}>
                Tôi đồng ý với{" "}
                <Link href="/terms" className={styles["link"]}>
                  điều khoản thanh toán
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className={styles["link"]}>
                  chính sách bảo mật
                </Link>
              </span>
            </label>
          </section>

          {/* Payment Button */}
          <div className={styles["payment-actions"]}>
            {/* If payment method is QR-based, offer Create QR flow */}
            {selectedMethod === "momo" || selectedMethod === "zalopay" ? (
              <>
                <button
                  className={`${styles["payment-btn"]} ${qrLoading ? styles["disabled"] : ""}`}
                  onClick={async (e) => {
                    createRipple(e);
                    // If user entered custom address and wants to save it, save before creating QR
                    if (
                      !useSavedAddress &&
                      customAddress &&
                      saveCustomAddress
                    ) {
                      const ok = await patchSaveAddress({
                        address: customAddress,
                        label: "",
                        is_default: false,
                      });
                      if (!ok)
                        alert("Không thể lưu địa chỉ. Vui lòng thử lại.");
                    }
                    // await handleCreateQr();
                    handleQR();
                    setQrModalOpen(true);
                  }}
                  disabled={qrLoading || processing}
                >
                  {qrLoading ? (
                    <>
                      <Icon
                        icon="mdi:loading"
                        width={24}
                        className={styles["spin"]}
                      />
                      Tạo QR...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:qrcode-scan" width={20} />
                      Tạo QR & Thanh toán {formatCurrency(totalAmount)}
                    </>
                  )}
                </button>

                {/* QR failure modal */}
                {/* {qrModalOpen! && (
                <div
                  className={styles["qr-modal-overlay"]}
                  onClick={() => setQrModalOpen(true)}
                >
                  <div
                    className={styles["qr-modal"]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles["qr-modal-header"]}>
                      <div className={styles["qr-error-icon"]}>
                        <Icon
                          icon="mdi:close-circle"
                          width={64}
                          color="#ef4444"
                        />
                      </div>
                      <h3 className={styles["qr-modal-title"]}>
                        Thanh toán thất bại
                      </h3>
                      <p className={styles["qr-modal-desc"]}>
                        Không thể hoàn tất thanh toán bằng mã QR. Vui lòng thử
                        lại hoặc chọn phương thức thanh toán khác.
                      </p>
                    </div>

                    {qrData && (
                      <div className={styles["qr-info"]}>
                        <div className={styles["qr-info-row"]}>
                          <span className={styles["qr-info-label"]}>
                            Mã giao dịch:
                          </span>
                          <span className={styles["qr-info-value"]}>
                            {qrData.qrId}
                          </span>
                        </div>
                        <div className={styles["qr-info-row"]}>
                          <span className={styles["qr-info-label"]}>
                            Trạng thái:
                          </span>
                          <span
                            className={`${styles["qr-info-value"]} ${styles["failed"]}`}
                          >
                            <Icon icon="mdi:alert-circle" width={16} />
                            Thất bại
                          </span>
                        </div>
                      </div>
                    )}

                    <div className={styles["qr-modal-actions"]}>
                      <button
                        className={styles["qr-btn-secondary"]}
                        onClick={() => setQrModalOpen(false)}
                      >
                        <Icon icon="mdi:close" width={20} />
                        Đóng
                      </button>
                      <button
                        className={styles["qr-btn-primary"]}
                        onClick={handleRetryNewQr}
                      >
                        <Icon icon="mdi:refresh" width={20} />
                        Tạo QR mới
                      </button>
                    </div>
                  </div>
                </div>
              )} */}
              </>
            ) : (
              <button
                className={`${styles["payment-btn"]} ${
                  !selectedMethod || !agreeTerms || processing
                    ? styles["disabled"]
                    : ""
                }`}
                onClick={async (e) => {
                  createRipple(e);
                  // Save custom address if requested
                  if (!useSavedAddress && customAddress && saveCustomAddress) {
                    const ok = await patchSaveAddress({
                      address: customAddress,
                      label: "",
                      is_default: false,
                    });
                    if (!ok) alert("Không thể lưu địa chỉ. Vui lòng thử lại.");
                  }
                  handleQR();
                  // setQrModalOpen(true);
                  if (normalizedPost.transaction_type == "sell") {
                    setQrModalOpen(true);
                  } else if (normalizedPost.transaction_type == "give away") {
                    handlePayment();
                  }
                  // handlePayment();
                }}
                disabled={!selectedMethod || !agreeTerms || processing}
              >
                {processing ? (
                  <>
                    <Icon
                      icon="mdi:loading"
                      width={24}
                      className={styles["spin"]}
                    />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:lock" width={20} />
                    Thanh toán {formatCurrency(totalAmount)}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Security Notice */}
          <div className={styles["security-notice"]}>
            <Icon icon="mdi:shield-check" width={20} color="#10b981" />
            <p>
              Giao dịch của bạn được bảo mật bởi mã hóa SSL 256-bit và tuân thủ
              tiêu chuẩn PCI DSS
            </p>
          </div>
        </div>
      </div>

      {qrModalOpen && (
        <div className={styles["overlay"]}>
          <div
            ref={overlayRef}
            className={styles["qrContainer"]}
            onClick={(e) => (e.stopPropagation(), handlePayment())}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <img src={qrURL} alt="" className={styles["qrImg"]} />

            <p className={styles["qrLabel"]}>Quét để thanh toán {countdown}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentComponent;
