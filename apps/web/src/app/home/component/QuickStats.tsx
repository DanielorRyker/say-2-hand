"use client";
import React, { useEffect, useState } from "react";
import styles from "./quickStats.module.scss";
import { Icon } from "@iconify/react";
import axios from "axios";
import { API_BASE } from "@/lib/constants";

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalTransactions: number;
  activePosts: number;
}

export default function QuickStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPosts: 0,
    totalTransactions: 0,
    activePosts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, postsRes, transRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users/`),
        axios.get(`${API_BASE}/api/posts/`),
        axios.get(`${API_BASE}/api/transactions/admin/statistics`),
      ]);

      const activePosts = postsRes.data.filter(
        (p: any) => p.status === "active"
      ).length;

      setStats({
        totalUsers: usersRes.data.length || 0,
        totalPosts: postsRes.data.length || 0,
        totalTransactions: transRes.data?.data?.totalTransactions || 0,
        activePosts: activePosts,
      });
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const statsData = [
    {
      icon: "material-symbols:group",
      label: "Người dùng",
      value: formatNumber(stats.totalUsers),
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      icon: "material-symbols:article",
      label: "Bài đăng",
      value: formatNumber(stats.totalPosts),
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      icon: "material-symbols:check-circle",
      label: "Đang hoạt động",
      value: formatNumber(stats.activePosts),
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      icon: "material-symbols:sync-alt",
      label: "Giao dịch",
      value: formatNumber(stats.totalTransactions),
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
  ];

  if (loading) {
    return (
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.statCardSkeleton}></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.statsSection}>
      <div className={styles.statsContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Thống kê nổi bật</h2>
          <p className={styles.sectionSubtitle}>
            Cộng đồng Say 2 Hand đang ngày càng phát triển
          </p>
        </div>

        <div className={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <div
              key={index}
              className={styles.statCard}
              data-color={stat.color}
            >
              <div className={styles.statIcon}>
                <Icon icon={stat.icon} width={40} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
