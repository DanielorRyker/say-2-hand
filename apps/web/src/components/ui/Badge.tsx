import React from "react";
import styles from "./Badge.module.scss";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "new"
    | "like-new"
    | "used"
    | "minor-flaw"
    | "for-repair"
    | "for-parts"
    | "success"
    | "warning"
    | "error"
    | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "info",
  size = "md",
  className = "",
}) => {
  const classNames = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return <span className={classNames}>{children}</span>;
};

export default Badge;
