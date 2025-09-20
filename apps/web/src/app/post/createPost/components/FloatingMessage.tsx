import React from "react";
import styles from "./FloatingMessage.module.scss";

export default function FloatingMessage({
  message,
}: {
  message: string | null;
}) {
  if (!message) return null;
  return (
    <div className={styles.box} role="status">
      {message}
    </div>
  );
}
