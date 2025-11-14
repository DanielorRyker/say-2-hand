"use client";
import Link from "next/link";
import { Icon } from "@iconify/react";
import styles from "./footer.module.scss";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerBar}>
      <div className={styles.footerContainer}>
        {/* About Section */}
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>Say 2 Hand</h3>
          <p className={styles.footerText}>
            Nền tảng mua bán, trao đổi đồ cũ uy tín và an toàn. Kết nối người
            mua và người bán với các giao dịch minh bạch, nhanh chóng.
          </p>
          <div className={styles.socialLinks}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Facebook"
            >
              <Icon icon="ri:facebook-fill" width={20} height={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Twitter"
            >
              <Icon icon="ri:twitter-x-fill" width={20} height={20} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="Instagram"
            >
              <Icon icon="ri:instagram-fill" width={20} height={20} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialIcon}
              aria-label="YouTube"
            >
              <Icon icon="ri:youtube-fill" width={20} height={20} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>Liên kết nhanh</h3>
          <Link href="/home" className={styles.footerLink}>
            Trang chủ
          </Link>
          <Link href="/search" className={styles.footerLink}>
            Tìm kiếm
          </Link>
          <Link href="/post/create" className={styles.footerLink}>
            Đăng tin
          </Link>
          <Link href="/profile" className={styles.footerLink}>
            Hồ sơ
          </Link>
        </div>

        {/* Support */}
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>Hỗ trợ</h3>
          <Link href="/help" className={styles.footerLink}>
            Trung tâm trợ giúp
          </Link>
          <Link href="/contact" className={styles.footerLink}>
            Liên hệ
          </Link>
          <Link href="/faq" className={styles.footerLink}>
            Câu hỏi thường gặp
          </Link>
          <Link href="/report" className={styles.footerLink}>
            Báo cáo vi phạm
          </Link>
        </div>

        {/* Legal */}
        <div className={styles.footerSection}>
          <h3 className={styles.footerTitle}>Pháp lý</h3>
          <Link href="/terms" className={styles.footerLink}>
            Điều khoản sử dụng
          </Link>
          <Link href="/privacy" className={styles.footerLink}>
            Chính sách bảo mật
          </Link>
          <Link href="/cookies" className={styles.footerLink}>
            Chính sách Cookie
          </Link>
          <Link href="/guidelines" className={styles.footerLink}>
            Quy định giao dịch
          </Link>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className={styles.footerBottom}>
        <p>
          © {currentYear} Say 2 Hand. Tất cả quyền được bảo lưu. Được phát
          triển với <Icon icon="mdi:heart" className={styles.heartIcon} /> bởi
          Say 2 Hand Team
        </p>
      </div>
    </footer>
  );
};

export default Footer;
