"use client";
import React from "react";
import styles from "./howItWorks.module.scss";
import { Icon } from "@iconify/react";

export default function HowItWorks() {
  const steps = [
    {
      icon: "material-symbols:person-add",
      title: "Đăng ký tài khoản",
      description:
        "Tạo tài khoản miễn phí chỉ trong vài giây. Xác thực email để tăng độ tin cậy.",
      color: "#3b82f6",
    },
    {
      icon: "material-symbols:add-photo-alternate",
      title: "Đăng tin bán/trao đổi",
      description:
        "Chụp ảnh, mô tả chi tiết sản phẩm và đặt giá. Hệ thống AI sẽ giúp bạn tối ưu tin đăng.",
      color: "#10b981",
    },
    {
      icon: "material-symbols:chat",
      title: "Kết nối với người mua",
      description:
        "Nhận tin nhắn từ người quan tâm. Trò chuyện trực tiếp để thỏa thuận chi tiết.",
      color: "#8b5cf6",
    },
    {
      icon: "material-symbols:handshake",
      title: "Giao dịch thành công",
      description:
        "Hẹn gặp, kiểm tra hàng và giao dịch. Đánh giá sau giao dịch để tăng uy tín.",
      color: "#f59e0b",
    },
  ];

  return (
    <section className={styles.howItWorksSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Cách thức hoạt động</h2>
          <p className={styles.sectionSubtitle}>
            4 bước đơn giản để bắt đầu mua bán, trao đổi đồ cũ
          </p>
        </div>

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <div
                className={`${styles.stepIcon} ${styles[`stepIcon${index}`]}`}
              >
                <Icon icon={step.icon} width={48} />
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
              {index < steps.length - 1 && (
                <div className={styles.stepConnector}>
                  <Icon icon="material-symbols:arrow-forward" width={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
