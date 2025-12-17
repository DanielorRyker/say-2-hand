"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./success.module.scss";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface TransactionData {
  transactionId: string;
  postId: string;
  postTitle: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  paymentMethod: string;
  timestamp: string;
  seller: {
    id: string;
    name: string;
  };
}

// Component nội dung sử dụng useSearchParams
const PaymentSuccessContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set mounted state to prevent hydration mismatch
    setIsMounted(true);

    // Load transaction data từ sessionStorage
    const txnId = searchParams.get("txn");
    const savedData = sessionStorage.getItem("lastTransaction");

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as TransactionData;
        if (!txnId || parsed.transactionId === txnId) {
          setTransaction(parsed);
          console.log("✅ Loaded transaction data:", parsed);
        }
      } catch (error) {
        console.error("❌ Error parsing transaction data:", error);
      }
    } else {
      console.warn("⚠️ No transaction data found in sessionStorage");
    }

    // Confetti effect on success
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Create confetti particles
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("div");
        particle.className = styles.confetti;
        particle.style.left = `${randomInRange(0, 100)}%`;
        particle.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDuration = `${randomInRange(2, 4)}s`;
        particle.style.animationDelay = `${randomInRange(0, 1)}s`;
        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 4000);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [searchParams]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format payment method name
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      momo: "Momo",
      zalopay: "ZaloPay",
      vnpay: "VNPay",
      bank: "Chuyển khoản ngân hàng",
    };
    return methods[method] || method;
  };

  /// Xuất file pdf

const exportInvoicePDF = async () => {
  const element = document.getElementById("invoice-print");
  const header = document.getElementById("invoice-header");
  if (!element || !header) return;

  //  HIỆN LOGO TRƯỚC KHI CHỤP
  header.classList.remove(styles["print-only"]);
  header.classList.add(styles["show-for-pdf"]);
  element.classList.add(styles["print-padding"]);

  await new Promise((r) => setTimeout(r, 50)); // đợi DOM update

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  //  ẨN LẠI LOGO SAU KHI CHỤP
  header.classList.remove(styles["show-for-pdf"]);
  element.classList.remove(styles["print-padding"]);
  header.classList.add(styles["print-only"]);

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = (canvas.height * pageWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  pdf.save("hoa-don-"+transaction?.transactionId+".pdf");
};

  return (
    <div className={styles["success-page"]}>
      <div className={styles.container}>
        <div className={styles["success-card"]}>
          <div className={styles["success-icon"]}>
            <Icon icon="mdi:check-circle" width={80} />
          </div>

          <h1 className={styles["success-title"]}>Thanh Toán Thành Công!</h1>

          <p className={styles["success-message"]}>
            Giao dịch của bạn đã được xử lý thành công.
            {transaction && ` Bạn đã mua "${transaction.postTitle}".`}
          </p>

          <div className={styles["transaction-info"]}>
            {!isMounted ? (
              // Skeleton loading to prevent hydration mismatch
              <div className={styles["info-row"]}>
                <span className={styles["info-label"]}>Đang tải...</span>
              </div>
            ) : transaction ? (
              <>
              <div id="invoice-print">
                 <div className={styles["print-only"]} id="invoice-header">
                    <img src="/image/header/Say2hand.svg" alt="Logo" className={styles["invoice-logo"]}/>
                    <h2>HÓA ĐƠN THANH TOÁN</h2>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Mã giao dịch:</span>
                  <span className={styles["info-value"]}>
                    #{transaction.transactionId}
                  </span>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Sản phẩm:</span>
                  <span className={styles["info-value"]}>
                    {transaction.postTitle}
                  </span>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Người bán:</span>
                  <span className={styles["info-value"]}>
                    {transaction.seller.name}
                  </span>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Giá sản phẩm:</span>
                  <span className={styles["info-value"]}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Phí dịch vụ:</span>
                  <span className={styles["info-value"]}>
                    {formatCurrency(transaction.serviceFee)}
                  </span>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Tổng thanh toán:</span>
                  <span
                    className={`${styles["info-value"]} ${styles["total-amount"]}`}
                  >
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Phương thức:</span>
                  <span className={styles["info-value"]}>
                    {getPaymentMethodName(transaction.paymentMethod)}
                  </span>
                </div>
                <div className={styles["info-row"]}>
                  <span className={styles["info-label"]}>Thời gian:</span>
                  <span className={styles["info-value"]}>
                    {new Date(transaction.timestamp).toLocaleString("vi-VN")}
                  </span>
                </div>
               
                </div>
              </>
            ) : (
              // Fallback if no transaction data (should rarely happen)
              <div className={styles["info-row"]}>
                <span className={styles["info-label"]}>
                  Giao dịch thành công!
                </span>
                <span className={styles["info-value"]}>
                  Vui lòng kiểm tra email để xem chi tiết.
                </span>
              </div>
            )}
          </div>

          <div className={styles["next-steps"]}>
            <h3 className={styles["steps-title"]}>Bước tiếp theo</h3>
            <ul className={styles["steps-list"]}>
              <li>
                <Icon icon="mdi:check" width={20} />
                <span>Người bán sẽ liên hệ với bạn trong 24h</span>
              </li>
              <li>
                <Icon icon="mdi:check" width={20} />
                <span>Kiểm tra email để xem chi tiết giao dịch</span>
              </li>
              <li>
                <Icon icon="mdi:check" width={20} />
                <span>
                  Bạn có thể theo dõi đơn hàng trong phần &ldquo;Đơn của
                  tôi&rdquo;
                </span>
              </li>
            </ul>
          </div>

          <div className={styles.actions}>
            <button
                  className={styles["btn-primary"]}
                  onClick={exportInvoicePDF}
                >
                  <Icon icon="ri:bill-fill" width={20} />
                  In hóa đơn
              </button>
            <Link href="/my-orders" className={styles["btn-secondary"]}>
              <Icon icon="mdi:account" width={20} />
              Xem đơn hàng
            </Link>
             
          </div>

          <button
            className={styles["support-link"]}
            onClick={() => router.push("/support")}
          >
            <Icon icon="mdi:help-circle" width={20} />
            Cần hỗ trợ?
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper component với Suspense boundary
const PaymentSuccessPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccessPage;
