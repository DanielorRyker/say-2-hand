"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import axios from "axios";
import styles from "./dashboard.module.scss";
import { API_BASE } from "@/lib/constants";

interface Statistics {
  totalUsers: number;
  totalPosts: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingPosts: number;
  activePosts: number;
  newUsersThisMonth: number;
  newPostsThisMonth: number;
  recentActivities: Activity[];
}

interface Activity {
  _id: string;
  type: string;
  user: {
    full_name: string;
    avatar?: string;
  };
  description: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const [usersRes, postsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users/`),
        axios.get(`${API_BASE}/api/posts/`),
        axios.get(`${API_BASE}/api/transactions/admin/statistics`),
      ]);

      const users = usersRes.data;
      const posts = postsRes.data;
      const transStats = transactionsRes.data.data;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const newUsersThisMonth = users.filter(
        (u: any) => new Date(u.createdAt) >= firstDayOfMonth
      ).length;

      const newPostsThisMonth = posts.filter(
        (p: any) => new Date(p.createdAt) >= firstDayOfMonth
      ).length;

      const pendingPosts = posts.filter(
        (p: any) => p.status === "pending_approval"
      ).length;
      const activePosts = posts.filter(
        (p: any) => p.status === "active"
      ).length;

      setStats({
        totalUsers: users.length,
        totalPosts: posts.length,
        totalTransactions: transStats?.total || 0,
        totalRevenue: transStats?.totalRevenue || 0,
        pendingPosts,
        activePosts,
        newUsersThisMonth,
        newPostsThisMonth,
        recentActivities: [],
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Icon icon="mdi:loading" className={styles.spinner} />
        <p>Đang tải thống kê...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Tổng Người dùng",
      value: stats?.totalUsers || 0,
      icon: "mdi:account-group",
      color: "#3b82f6",
      trend: `+${stats?.newUsersThisMonth || 0} tháng này`,
    },
    {
      title: "Tổng Bài đăng",
      value: stats?.totalPosts || 0,
      icon: "mdi:post",
      color: "#10b981",
      trend: `+${stats?.newPostsThisMonth || 0} tháng này`,
    },
    {
      title: "Chờ duyệt",
      value: stats?.pendingPosts || 0,
      icon: "mdi:clock-alert",
      color: "#f59e0b",
      trend: "Cần xử lý",
    },
    {
      title: "Giao dịch",
      value: stats?.totalTransactions || 0,
      icon: "mdi:cash-multiple",
      color: "#8b5cf6",
      trend: `${stats?.totalRevenue?.toLocaleString("vi-VN") || 0} VNĐ`,
    },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icon icon="mdi:view-dashboard" />
          <h1>Quản trị hệ thống</h1>
        </div>
      </div>
      <div className={styles.statsGrid}>
        {statCards.map((card, index) => (
          <div key={index} className={styles.statCard}>
            <div
              className={styles.cardIcon}
              style={{ backgroundColor: card.color }}
            >
              <Icon icon={card.icon} />
            </div>
            <div className={styles.cardContent}>
              <h3>{card.title}</h3>
              <p className={styles.value}>
                {card.value.toLocaleString("vi-VN")}
              </p>
              <span className={styles.trend}>{card.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Thống kê Bài đăng</h3>
            <Icon icon="mdi:chart-bar" />
          </div>
          <div className={styles.chartContent}>
            <div className={styles.chartItem}>
              <span className={styles.label}>Đang hoạt động</span>
              <div className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${((stats?.activePosts || 0) / (stats?.totalPosts || 1)) * 100}%`,
                    backgroundColor: "#10b981",
                  }}
                />
              </div>
              <span className={styles.value}>{stats?.activePosts || 0}</span>
            </div>
            <div className={styles.chartItem}>
              <span className={styles.label}>Chờ duyệt</span>
              <div className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${((stats?.pendingPosts || 0) / (stats?.totalPosts || 1)) * 100}%`,
                    backgroundColor: "#f59e0b",
                  }}
                />
              </div>
              <span className={styles.value}>{stats?.pendingPosts || 0}</span>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3>Hoạt động Gần đây</h3>
            <Icon icon="mdi:history" />
          </div>
          <div className={styles.activityList}>
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => (
                <div key={activity._id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    <Icon icon="mdi:circle-small" />
                  </div>
                  <div className={styles.activityContent}>
                    <p>{activity.description}</p>
                    <span>
                      {new Date(activity.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <Icon icon="mdi:information-outline" />
                <p>Chưa có hoạt động gần đây</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <div className={styles.actionsGrid}>
          <Link href="/admin/posts" className={styles.actionCard}>
            <Icon icon="mdi:clipboard-check" />
            <span>Duyệt bài đăng</span>
            {stats?.pendingPosts ? (
              <span className={styles.badge}>{stats.pendingPosts}</span>
            ) : null}
          </Link>
          <Link href="/admin/users" className={styles.actionCard}>
            <Icon icon="mdi:account-plus" />
            <span>Quản lý người dùng</span>
          </Link>
          <Link href="/admin/categories" className={styles.actionCard}>
            <Icon icon="mdi:shape" />
            <span>Quản lý danh mục</span>
          </Link>
          <Link href="/admin/reports" className={styles.actionCard}>
            <Icon icon="mdi:alert-octagon" />
            <span>Xem báo cáo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
