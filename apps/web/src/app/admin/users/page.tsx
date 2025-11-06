"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import axios from "@/lib/api-client";
import Image from "next/image";
import { Table, Pagination, FilterBar } from "@/components/admin";
import styles from "./users.module.scss";
import { API_BASE, formatImageUrl } from "@/lib/constants";

interface User {
  _id: string;
  email?: string;
  full_name?: string;
  role?: string;
  status?: string;
  phone_number?: string;
  address?: string;
  description?: string;
  avatar?: string;
  reputation?: {
    average_score: number;
    total_ratings: number;
  };
  posts_count?: number;
  createdAt?: string;
}

type TabType = "all" | "active" | "banned";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter state
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter((user) => user.status === activeTab);
    }

    // Apply active filters
    if (activeFilters.role && activeFilters.role !== "") {
      filtered = filtered.filter((user) => user.role === activeFilters.role);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phone_number?.includes(searchQuery)
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, activeTab, activeFilters, searchQuery]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/users/`);
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn khóa người dùng này?")) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_BASE}/api/users`,
        { _id: userId, status: "banned" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: "banned" } : u))
      );
      alert("Đã khóa người dùng");
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Có lỗi xảy ra");
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `${API_BASE}/api/users`,
        { _id: userId, status: "active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: "active" } : u))
      );
      alert("Đã mở khóa người dùng");
    } catch (error) {
      console.error("Error activating user:", error);
      alert("Có lỗi xảy ra");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác!"
      )
    )
      return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_BASE}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      alert("Đã xóa người dùng");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Có lỗi xảy ra");
    }
  };

  const columns = [
    {
      key: "avatar",
      title: "Avatar",
      width: "80px",
      render: (_: any, user: User) => (
        <div className={styles.avatarCell}>
          {user.avatar ? (
            <Image
              src={
                formatImageUrl(user.avatar) ||
                "/image/profile/avatar-default.png"
              }
              alt={user.full_name || ""}
              width={48}
              height={48}
              unoptimized
            />
          ) : (
            <Icon icon="mdi:account-circle" />
          )}
        </div>
      ),
    },
    {
      key: "full_name",
      title: "Họ tên",
      render: (_: any, user: User) => (
        <div className={styles.userInfo}>
          <p className={styles.name}>{user.full_name}</p>
          <p className={styles.email}>{user.email}</p>
        </div>
      ),
    },
    {
      key: "phone_number",
      title: "Số điện thoại",
    },
    {
      key: "role",
      title: "Vai trò",
      render: (role: string) => (
        <span className={`${styles.badge} ${styles[role]}`}>
          {role === "admin" ? "Admin" : role === "mod" ? "Mod" : "User"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (status: string) => (
        <span className={`${styles.status} ${styles[status]}`}>
          {status === "active" ? "Hoạt động" : "Bị khóa"}
        </span>
      ),
    },
    {
      key: "reputation",
      title: "Đánh giá",
      render: (reputation: User["reputation"]) => (
        <div className={styles.reputation}>
          <Icon icon="mdi:star" />
          <span>{reputation?.average_score?.toFixed(1) || "0.0"}</span>
          <span className={styles.count}>
            ({reputation?.total_ratings || 0})
          </span>
        </div>
      ),
    },
    {
      key: "posts_count",
      title: "Bài đăng",
      render: (count: number) => <span>{count || 0}</span>,
    },
    {
      key: "actions",
      title: "Hành động",
      render: (_: any, user: User) => (
        <div className={styles.actions}>
          <button
            className={styles.btnView}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedUser(user);
            }}
            title="Xem chi tiết"
          >
            <Icon icon="mdi:eye" />
          </button>
          {user.status === "active" ? (
            <button
              className={styles.btnBan}
              onClick={(e) => {
                e.stopPropagation();
                handleBanUser(user._id);
              }}
              title="Khóa người dùng"
            >
              <Icon icon="mdi:lock" />
            </button>
          ) : (
            <button
              className={styles.btnActivate}
              onClick={(e) => {
                e.stopPropagation();
                handleActivateUser(user._id);
              }}
              title="Mở khóa"
            >
              <Icon icon="mdi:lock-open" />
            </button>
          )}
          <button
            className={styles.btnDelete}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteUser(user._id);
            }}
            title="Xóa người dùng"
          >
            <Icon icon="mdi:delete" />
          </button>
        </div>
      ),
    },
  ];

  const tabs = [
    { key: "all", label: "Tất cả", count: users.length },
    {
      key: "active",
      label: "Hoạt động",
      count: users.filter((u) => u.status === "active").length,
    },
    {
      key: "banned",
      label: "Bị khóa",
      count: users.filter((u) => u.status === "banned").length,
    },
  ];

  // Filter configuration
  const filterConfig = [
    {
      label: "Vai trò",
      key: "role",
      options: [
        { label: "Tất cả", value: "" },
        {
          label: "Admin",
          value: "admin",
          count: users.filter((u) => u.role === "admin").length,
        },
        {
          label: "Moderator",
          value: "mod",
          count: users.filter((u) => u.role === "mod").length,
        },
        {
          label: "User",
          value: "user",
          count: users.filter((u) => u.role === "user").length,
        },
      ],
    },
  ];

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className={styles.usersPage}>
      <div className={styles.header}>
        <h1>
          <Icon icon="mdi:account-group" />
          Quản lý Người dùng
        </h1>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Icon icon="mdi:magnify" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <span>{tab.label}</span>
            <span className={styles.count}>{tab.count}</span>
          </button>
        ))}
      </div>

      <FilterBar
        filters={filterConfig}
        activeFilters={activeFilters}
        onFilterChange={(key, value) => {
          setActiveFilters({ ...activeFilters, [key]: value });
        }}
        onClearAll={() => setActiveFilters({})}
      />

      <Table columns={columns} data={paginatedUsers} loading={loading} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          maxVisible={5}
        />
      )}

      {/* Modal chi tiết người dùng */}
      {selectedUser && (
        <div className={styles.modal} onClick={() => setSelectedUser(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Thông tin Người dùng</h2>
              <button onClick={() => setSelectedUser(null)} title="Đóng">
                <Icon icon="mdi:close" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.userDetail}>
                <div className={styles.avatarLarge}>
                  {selectedUser.avatar ? (
                    <Image
                      src={
                        formatImageUrl(selectedUser.avatar) ||
                        "/image/profile/avatar-default.png"
                      }
                      alt={selectedUser.full_name || ""}
                      width={120}
                      height={120}
                      unoptimized
                    />
                  ) : (
                    <Icon icon="mdi:account-circle" />
                  )}
                </div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Họ tên:</label>
                    <span>{selectedUser.full_name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Email:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Số điện thoại:</label>
                    <span>{selectedUser.phone_number || "Chưa cập nhật"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Vai trò:</label>
                    <span
                      className={`${styles.badge} ${styles[selectedUser.role || ""]}`}
                    >
                      {selectedUser.role === "admin"
                        ? "Admin"
                        : selectedUser.role === "mod"
                          ? "Mod"
                          : "User"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Trạng thái:</label>
                    <span
                      className={`${styles.status} ${styles[selectedUser.status || ""]}`}
                    >
                      {selectedUser.status === "active"
                        ? "Hoạt động"
                        : "Bị khóa"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Ngày tham gia:</label>
                    <span>
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Số bài đăng:</label>
                    <span>{selectedUser.posts_count || 0}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Đánh giá:</label>
                    <div className={styles.reputation}>
                      <Icon icon="mdi:star" />
                      <span>
                        {selectedUser.reputation?.average_score?.toFixed(1) ||
                          "0.0"}
                      </span>
                      <span className={styles.count}>
                        ({selectedUser.reputation?.total_ratings || 0} đánh giá)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
