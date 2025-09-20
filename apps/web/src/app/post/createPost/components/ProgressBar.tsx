import React from "react";
import styles from "./ProgressBar.module.scss";

export default function ProgressBar({ step }: { step: number }) {
  // For simplicity we support 3 steps => widths 0%,50%,100%
  const cls = step === 1 ? styles.p0 : step === 2 ? styles.p50 : styles.p100;
  return (
    <div className={styles.progressBar} aria-hidden>
      <div className={`${styles.progress} ${cls}`} />
    </div>
  );
}
