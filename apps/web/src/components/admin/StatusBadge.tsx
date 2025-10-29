import { Icon } from "@iconify/react";
import styles from "./status-badge.module.scss";

export type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending"
  | "active"
  | "inactive"
  | "banned"
  | "approved"
  | "rejected";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  icon?: string;
  size?: "small" | "medium" | "large";
}

const statusConfig: Record<
  StatusType,
  { color: string; bgColor: string; icon: string; defaultLabel: string }
> = {
  success: {
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "mdi:check-circle",
    defaultLabel: "Thành công",
  },
  warning: {
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "mdi:alert-circle",
    defaultLabel: "Cảnh báo",
  },
  error: {
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "mdi:close-circle",
    defaultLabel: "Lỗi",
  },
  info: {
    color: "#0284c7",
    bgColor: "#e0f2fe",
    icon: "mdi:information-circle",
    defaultLabel: "Thông tin",
  },
  pending: {
    color: "#f59e0b",
    bgColor: "#fef3c7",
    icon: "mdi:clock-outline",
    defaultLabel: "Chờ xử lý",
  },
  active: {
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "mdi:check-circle",
    defaultLabel: "Hoạt động",
  },
  inactive: {
    color: "#6b7280",
    bgColor: "#f3f4f6",
    icon: "mdi:minus-circle",
    defaultLabel: "Không hoạt động",
  },
  banned: {
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "mdi:cancel",
    defaultLabel: "Bị cấm",
  },
  approved: {
    color: "#10b981",
    bgColor: "#d1fae5",
    icon: "mdi:check-decagram",
    defaultLabel: "Đã duyệt",
  },
  rejected: {
    color: "#ef4444",
    bgColor: "#fee2e2",
    icon: "mdi:close-octagon",
    defaultLabel: "Từ chối",
  },
};

export function StatusBadge({
  status,
  label,
  icon,
  size = "medium",
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;
  const displayIcon = icon || config.icon;

  return (
    <div
      className={`${styles.statusBadge} ${styles[size]}`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
      }}
    >
      <Icon icon={displayIcon} className={styles.icon} />
      <span className={styles.label}>{displayLabel}</span>
    </div>
  );
}
