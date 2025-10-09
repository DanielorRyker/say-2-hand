import React from "react";
import styles from "./ProgressBar.module.scss";

export default function ProgressBar({ step }: { step: number }) {
  // Đơn giản hoá: hỗ trợ 3 bước => các độ rộng 0%, 50%, 100%
  const cls = step === 1 ? styles.p0 : step === 2 ? styles.p50 : styles.p100;
  return (
    <div className={styles.progressBar} aria-hidden>
      <div className={`${styles.progress} ${cls}`} />
    </div>
  );
}
