import React from "react";
import styles from "./ConversationSkeleton.module.scss";

const ConversationSkeleton = () => {
  return (
    <div className={styles.skeletonWrapper}>
      <div className={styles.sidebarSkeleton} />
      <div className={styles.mainSkeleton}>
        <div className={styles.headerSkeleton} />
        <div className={styles.messagesSkeleton}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.messageSkeleton} />
          ))}
        </div>
        <div className={styles.inputSkeleton} />
      </div>
    </div>
  );
};

export default ConversationSkeleton;
