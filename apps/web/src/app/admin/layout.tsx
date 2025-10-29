"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import styles from "./admin.module.scss";
import { formatImageUrl } from "../../lib/constants";

interface User {
  _id: string;
  full_name: string;
  email?: string;
  role: string;
  avatar?: string;
}

const menuItems = [
  {
    title: "Dashboard",
    icon: "mdi:view-dashboard",
    path: "/admin",
  },
  {
    title: "Quản lý Người dùng",
    icon: "mdi:account-group",
    path: "/admin/users",
  },
  {
    title: "Quản lý Bài đăng",
    icon: "mdi:post",
    path: "/admin/posts",
  },
  {
    title: "Quản lý Danh mục",
    icon: "mdi:shape",
    path: "/admin/categories",
  },
  {
    title: "Quản lý Giao dịch",
    icon: "mdi:cash-multiple",
    path: "/admin/transactions",
  },
  {
    title: "Báo cáo Vi phạm",
    icon: "mdi:alert-octagon",
    path: "/admin/reports",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role !== "admin" && userData.role !== "mod") {
        router.push("/");
        return;
      }
      setUser(userData);
    } else {
      router.push("/auth/login");
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Icon icon="mdi:loading" className={styles.spinner} />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span>Say2Hand Admin</span>
          </div>
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Icon
              icon={
                sidebarOpen
                  ? "line-md:menu-to-close-alt-transition"
                  : "line-md:close-to-menu-alt-transition"
              }
              width={32}
              height={32}
            />
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${
                pathname === item.path ? styles.active : ""
              }`}
            >
              <Icon icon={item.icon} />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <Icon icon="mdi:logout" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Quản trị hệ thống</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
}
