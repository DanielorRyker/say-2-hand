import { Icon } from "@iconify/react";
import styles from "./confirm-dialog.module.scss";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

const typeConfig = {
  danger: {
    icon: "mdi:alert-circle",
    color: "#ef4444",
  },
  warning: {
    icon: "mdi:alert",
    color: "#f59e0b",
  },
  info: {
    icon: "mdi:information",
    color: "#0284c7",
  },
  success: {
    icon: "mdi:check-circle",
    color: "#10b981",
  },
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "info",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = typeConfig[type];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper} style={{ color: config.color }}>
          <Icon icon={config.icon} className={styles.icon} />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`${styles.confirmButton} ${styles[type]}`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
