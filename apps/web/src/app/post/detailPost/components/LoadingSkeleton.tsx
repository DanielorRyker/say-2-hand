import React from "react";
import styles from "./LoadingSkeleton.module.scss";

const LoadingSkeleton: React.FC = () => {
  return (
    <div id="loading-skeleton" className={`${styles["loading-skeleton"]}`}>
      <div className={`${styles["skelHeader"]}`} />
      <div className={`${styles["skelGrid"]}`}>
        <div className={`${styles["skelLeft"]}`}>
          <div className={`${styles["skelLargeImage"]}`} />

          <div className={`${styles["skelThumbsGrid"]}`}>
            <div className={`${styles["skelThumb"]}`} />
            <div className={`${styles["skelThumb"]}`} />
            <div className={`${styles["skelThumb"]}`} />
            <div className={`${styles["skelThumb"]}`} />
          </div>

          <div className={`${styles["skelWide"]}`} />
          <div className={`${styles["skelMedium"]}`} />

          <div className={`${styles["skelTextGroup"]}`}>
            <div className={`${styles["skelTextFull"]}`} />
            <div className={`${styles["skelTextLarge"]}`} />
            <div className={`${styles["skelTextMedium"]}`} />
          </div>
        </div>

        <div className={`${styles["skelRight"]}`}>
          <div className={`${styles["sellerBox"]}`}>
            <div className={`${styles["sellerHead"]}`}>
              <div className={`${styles["skelAvatar"]}`} />
              <div className={`${styles["sellerMetaLines"]}`}>
                <div className={`${styles["skelLineShort"]}`} />
                <div className={`${styles["skelLineTiny"]}`} />
              </div>
            </div>
            <div className={`${styles["skelInput"]}`} />
          </div>
          <div className={`${styles["skelSticky"]}`} />
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
