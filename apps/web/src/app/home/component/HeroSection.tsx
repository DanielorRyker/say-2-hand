"use client";
import React from "react";
import styles from "./heroSection.module.scss";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              <span className={styles.gradientText}>Say 2 Hand</span>
              <br />
              Nền tảng trao đổi đồ cũ
              <br />
              <span className={styles.highlight}>Uy tín #1 Việt Nam</span>
            </h1>
            <p className={styles.heroDescription}>
              Mua bán, trao đổi, tặng đồ cũ dễ dàng. An toàn, tiện lợi và thân
              thiện với môi trường. Tham gia cộng đồng hơn{" "}
              <strong>10,000+</strong> người dùng ngay hôm nay!
            </p>
            <div className={styles.heroCTA}>
              <button
                className={`${styles.btnPrimary} ${styles.btnLarge}`}
                onClick={() => router.push("/auth/register")}
              >
                <Icon icon="material-symbols:person-add" width={24} />
                Đăng ký miễn phí
              </button>
              <button
                className={`${styles.btnSecondary} ${styles.btnLarge}`}
                onClick={() => router.push("/search")}
              >
                <Icon icon="material-symbols:search" width={24} />
                Khám phá ngay
              </button>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.imageWrapper}>
              <Icon
                icon="fluent:shopping-bag-tag-24-filled"
                width={280}
                className={styles.mainIcon}
              />
              <div className={styles.floatingCard}>
                <Icon icon="material-symbols:verified" width={24} />
                <span>Đã xác thực</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className={styles.trustIndicators}>
          <div className={styles.trustItem}>
            <Icon icon="material-symbols:verified-user" width={32} />
            <div>
              <strong>100% An toàn</strong>
              <span>Giao dịch được bảo vệ</span>
            </div>
          </div>
          <div className={styles.trustItem}>
            <Icon icon="material-symbols:eco" width={32} />
            <div>
              <strong>Thân thiện môi trường</strong>
              <span>Tái sử dụng đồ cũ</span>
            </div>
          </div>
          <div className={styles.trustItem}>
            <Icon icon="material-symbols:groups" width={32} />
            <div>
              <strong>Cộng đồng lớn</strong>
              <span>10,000+ thành viên</span>
            </div>
          </div>
          <div className={styles.trustItem}>
            <Icon icon="material-symbols:support-agent" width={32} />
            <div>
              <strong>Hỗ trợ 24/7</strong>
              <span>Luôn sẵn sàng giúp đỡ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
