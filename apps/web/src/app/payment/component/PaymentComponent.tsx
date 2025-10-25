/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "../payment.module.scss";
import { Icon } from "@iconify/react";
import axios from "axios";
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
    icon: "simple-icons:momo",
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
    icon: "material-symbols:payment",
    color: "#0066b2",
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
  const [openQR, setOpenQR] = useState(false);
  const [qrURL, setQrURL] = useState<string | undefined>(undefined);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

    //  Ẩn popup khi click ra ngoài
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
       if (popupRef.current && popupRef.current.contains(target)) return;
       if (overlayRef.current && overlayRef.current.contains(target)) return;
        setOpenQR(false);
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);

   useEffect(() => {
  if (openQR) document.body.style.overflow = "hidden";
  else document.body.style.overflow = "auto";
}, [openQR]);



  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

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

  const handlePayment = useCallback(async () => {
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

      // TODO: Integrate with real payment gateway
      // Tạm thời mock payment - backend chưa có endpoint /api/payments
      // await axios.post("http://localhost:8080/api/payments", {
      //   user_id: currentUser._id,
      //   post_id: normalizedPost._id,
      //   amount: normalizedPost.price,
      //   payment_method: selectedMethod,
      // });

      // Lưu thông tin giao dịch vào sessionStorage để hiển thị ở success page
      const transactionData = {
        transactionId: `TXN${Date.now()}`,
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
      console.log("✅ Payment successful! Transaction:", transactionData);
      //Tạo Transaction và Thông báo cho người bán
        const res =await axios.post("http://localhost:8080/api/transactions", {      
        post_id:  normalizedPost._id,
        seller_id: normalizedPost.author_id?._id || normalizedPost.author_id,
        buyer_id: currentUser._id,
        amount: normalizedPost.price,
        currency: "VND",
        payment_gateway: "vnpay", 
        payment_method: selectedMethod, 
        payment_status: "paid", 
        transaction_ref: "VNPAY202510200002", //
        status: "pending"
      });
      console.log("Transaction API response:", res.data);
       await axios.post("http://localhost:8080/api/notifications", {      
        receiver_id: normalizedPost.author_id?._id || normalizedPost.author_id,
        sender_id: currentUser._id,
        title: "Bạn có đơn hàng mới",
        body: currentUser.full_name +" đã đặt mua sản phẩm "+normalizedPost.title+" của bạn.",
        type: "transaction",
        related_id:  res.data.data._id,
        related_model:"Transaction",
        deeplink: "",
        channel: "in_app",
        is_read: false
      });

      await axios.post("http://localhost:8080/api/notifications", {      
        receiver_id: currentUser._id,
        sender_id: normalizedPost.author_id?._id || normalizedPost.author_id,
        title: "Mua hàng thành công",
        body: "Vui lòng chờ "+ normalizedPost.author_id?.full_name +" xác nhận đơn hàng của bạn.",
        type: "transaction",
        related_id:  res.data.data._id,
        related_model:"Transaction",
        deeplink: "",
        channel: "in_app",
        is_read: false
      });

      // Redirect đến success page
      window.location.href = `/payment/success?txn=${transactionData.transactionId}`;
    } catch (error: any) {
      console.error("❌ Payment error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // User-friendly error message
      const errorMsg =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      alert(
        `Thanh toán thất bại: ${errorMsg}\n\nVui lòng thử lại hoặc chọn phương thức thanh toán khác.`
      );
    } finally {
      setProcessing(false);
    }
  }, [selectedMethod, agreeTerms, normalizedPost]);

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
  const handleQR = async () =>{
    const query = new URLSearchParams({
        accountNo: '2006205431189',
        accountName:normalizedPost.author_id?.full_name ,
        amount: normalizedPost.price + Math.round(normalizedPost.price * 0.03),
        addInfo:'Thanh toan don hang '+normalizedPost.title+' gia '+normalizedPost.price+' vnd',
      }).toString();
      
      
    const res = await fetch(`http://localhost:8080/api/qr?${query}`);
      if (!res.ok) {
        throw new Error('Failed to generate QR');
      }
      // Assuming the API returns { url: "..." }
      const data = await res.json();
      console.log('query:'+data.qrUrl);
      setQrURL(data.qrUrl);
  }

  

  return (
   <div >

   
    <div className={styles["payment-container"]} ref={popupRef} >
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
                  <Icon icon={method.icon} width={32} color={method.color} />
                </div>
                <div className={styles["method-info"]}>
                  <h4 className={styles["method-name"]}>{method.name}</h4>
                  <p className={styles["method-desc"]}>{method.description}</p>
                </div>
                <div className={styles["method-check"]}>
                  {selectedMethod === method.id && (
                    <Icon icon="mdi:check-circle" width={24} color="#10b981" />
                  )}
                </div>
              </button>
            ))}
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
              <span className={styles["summary-label"]}>Phí dịch vụ (3%):</span>
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
          <button
            className={`${styles["payment-btn"]} ${
              !selectedMethod || !agreeTerms || processing
                ? styles["disabled"]
                : ""
            }`}
            onClick={(e) => {
              createRipple(e);
              handleQR();
              setOpenQR(true);
              
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

{openQR && (
  <div
    className={styles["overlay"] }
    
  >
    <div 
      ref={overlayRef}
      className={styles["qrContainer"]}
      onClick={(e) => (e.stopPropagation() ,handlePayment())} 
      onMouseDown={(e) => e.stopPropagation()}
    >
      <img src={qrURL} alt="" />
    </div>
  </div>
)}



</div>
    
  );
};

export default PaymentComponent;
