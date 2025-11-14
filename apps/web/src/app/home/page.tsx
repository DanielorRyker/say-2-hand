"use client";
import styles from "@/app/home/home.module.scss";
import HeroSection from "@/app/home/component/HeroSection";
import QuickStats from "@/app/home/component/QuickStats";
import Category from "@/app/home/component/Category";
import ListPost from "@/app/home/component/ListPost";
import HowItWorks from "@/app/home/component/HowItWorks";
import CTASection from "@/app/home/component/CTASection";
import { useAuth } from "@/hooks";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Giao diện cho người CHƯA đăng nhập
  if (!isAuthenticated) {
    return (
      <div className={styles.homePage}>
        {/* Hero Section - Banner chào mừng với CTA đăng ký */}
        <HeroSection />

        {/* Quick Stats - Thống kê tổng quan */}
        <QuickStats />

        {/* Category Section - Danh mục sản phẩm */}
        <div className={styles.categorySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Danh mục nổi bật</h2>
            <p className={styles.sectionSubtitle}>
              Khám phá các danh mục phổ biến trên Say 2 Hand
            </p>
          </div>
          <Category />
        </div>

        {/* Featured Posts - Bài đăng nổi bật */}
        <div className={styles.postsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Bài đăng nổi bật</h2>
            <p className={styles.sectionSubtitle}>
              Những món đồ chất lượng đang được ưa chuộng
            </p>
          </div>
          <ListPost />
        </div>

        {/* How It Works - Hướng dẫn sử dụng */}
        <HowItWorks />

        {/* CTA Section - Kêu gọi đăng ký */}
        <CTASection />
      </div>
    );
  }

  // Giao diện cho người ĐÃ đăng nhập
  return (
    <div className={styles.homePage}>
      {/* Welcome Message - Thông báo chào mừng người dùng */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Xin chào! Sẵn sàng khám phá hôm nay?
          </h1>
          <p className={styles.welcomeSubtitle}>
            Tìm kiếm món đồ cũ ưng ý hoặc đăng bán ngay
          </p>
        </div>
      </div>

      {/* Quick Stats - Thống kê cá nhân hóa */}
      <QuickStats />

      {/* Category Section - Danh mục được đề xuất */}
      <div className={styles.categorySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Danh mục gợi ý cho bạn</h2>
        </div>
        <Category />
      </div>

      {/* Featured Posts - Bài đăng mới nhất */}
      <div className={styles.postsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Bài đăng mới nhất</h2>
          <p className={styles.sectionSubtitle}>
            Những món đồ vừa được đăng bán, trao đổi gần đây
          </p>
        </div>
        <ListPost />
      </div>

      {/* Recommended Posts - Bài đăng gợi ý (có thể thêm sau) */}
      {/* <div className={styles.postsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Gợi ý dành cho bạn</h2>
          <p className={styles.sectionSubtitle}>
            Dựa trên lịch sử xem và sở thích của bạn
          </p>
        </div>
        <ListPost filter="recommended" />
      </div> */}
    </div>
  );
}
