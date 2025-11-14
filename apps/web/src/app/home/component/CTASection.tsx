"use client";
import React from "react";
import styles from "./ctaSection.module.scss";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function CTASection() {
  const router = useRouter();

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContainer}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Bắt đầu hành trình
            <br />
            <span className={styles.highlight}>Xanh - Sạch - Tiết kiệm</span>
          </h2>
          <p className={styles.ctaDescription}>
            Tham gia cộng đồng trao đổi đồ cũ lớn nhất Việt Nam ngay hôm nay.
            Giúp môi trường xanh hơn, túi tiền đầy hơn!
          </p>
          <div className={styles.ctaBtnGroup}>
            <button
              className={`${styles.btnCTA} ${styles.btnPrimary}`}
              onClick={() => router.push("/auth/register")}
            >
              <Icon icon="material-symbols:person-add" width={24} />
              Đăng ký miễn phí
            </button>
            <button
              className={`${styles.btnCTA} ${styles.btnSecondary}`}
              onClick={() => router.push("/home")}
            >
              <Icon icon="material-symbols:explore" width={24} />
              Khám phá ngay
            </button>
          </div>
        </div>

        <div className={styles.ctaStats}>
          <div className={styles.statBadge}>
            <Icon icon="material-symbols:verified" width={32} />
            <div>
              <strong>100%</strong>
              <span>Miễn phí</span>
            </div>
          </div>
          <div className={styles.statBadge}>
            <Icon icon="material-symbols:security" width={32} />
            <div>
              <strong>Bảo mật</strong>
              <span>Thông tin</span>
            </div>
          </div>
          <div className={styles.statBadge}>
            <Icon icon="material-symbols:eco" width={32} />
            <div>
              <strong>Xanh</strong>
              <span>Môi trường</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
