"use client";

import React from "react";
import { Icon } from "@iconify/react";
import styles from "./ConditionModal.module.scss";

interface ConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConditions: string[];
  setSelectedConditions: (conditions: string[]) => void;
}

const CONDITIONS = [
  {
    value: "new",
    label: "Mới 100%",
    icon: "mdi:new-box",
    color: "#10b981",
    description: "Chưa qua sử dụng, nguyên seal",
  },
  {
    value: "like_new",
    label: "Gần như mới",
    icon: "mdi:star",
    color: "#06b6d4",
    description: "Sử dụng ít, còn như mới",
  },
  {
    value: "used",
    label: "Đã sử dụng",
    icon: "mdi:check",
    color: "#3b82f6",
    description: "Sử dụng bình thường, còn tốt",
  },
  {
    value: "minor_flaw",
    label: "Hư nhẹ",
    icon: "mdi:wrench",
    color: "#f97316",
    description: "Có vài khuyết điểm nhỏ",
  },
  {
    value: "for_repair",
    label: "Cần sửa chữa",
    icon: "mdi:tools",
    color: "#8b5cf6",
    description: "Cần sửa chữa để sử dụng",
  },
  {
    value: "for_parts",
    label: "Đã hư",
    icon: "mdi:archive",
    color: "#ef4444",
    description: "Chỉ lấy linh kiện",
  },
];

export default function ConditionModal({
  isOpen,
  onClose,
  selectedConditions,
  setSelectedConditions,
}: ConditionModalProps) {
  if (!isOpen) return null;

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <Icon icon="mdi:check-circle" width={24} height={24} />
            Chọn tình trạng
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.conditionGrid}>
            {CONDITIONS.map((condition) => {
              const active = selectedConditions.includes(condition.value);
              return (
                <React.Fragment key={condition.value}>
                  {active ? (
                    <button
                      className={`${styles.conditionCard} ${styles.active}`}
                      onClick={() => toggleCondition(condition.value)}
                      aria-pressed="true"
                      title={condition.label}
                    >
                      <div className={styles.conditionIcon}>
                        <Icon icon={condition.icon} width={20} height={20} />
                      </div>
                      <div className={styles.conditionInfo}>
                        <h4>{condition.label}</h4>
                      </div>
                      <div className={styles.checkMark}>
                        <Icon icon="mdi:check" width={16} height={16} />
                      </div>
                    </button>
                  ) : (
                    <button
                      className={styles.conditionCard}
                      onClick={() => toggleCondition(condition.value)}
                      aria-pressed="false"
                      title={condition.label}
                    >
                      <div className={styles.conditionIcon}>
                        <Icon icon={condition.icon} width={20} height={20} />
                      </div>
                      <div className={styles.conditionInfo}>
                        <h4>{condition.label}</h4>
                      </div>
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.clearBtn}
            onClick={() => setSelectedConditions([])}
          >
            <Icon icon="mdi:close-circle" width={18} height={18} />
            Xóa chọn
          </button>
          <button className={styles.applyBtn} onClick={onClose}>
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng ({selectedConditions.length})
          </button>
        </div>
      </div>
    </div>
  );
}
