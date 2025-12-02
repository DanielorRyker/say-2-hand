// DescriptionCard.tsx - Component hiển thị mô tả chi tiết sản phẩm
import React from "react";
import styles from "./DescriptionCard.module.scss";

interface DescriptionCardProps {
  description: string;
  isDescExpanded: boolean;
  setIsDescExpanded: (v: boolean) => void;
  needsTruncate: (text: string) => boolean;
  getShortDescription: (text: string) => string;
  descRef: React.RefObject<HTMLParagraphElement>;
}

// Component hiển thị mô tả chi tiết sản phẩm
const DescriptionCard: React.FC<DescriptionCardProps> = ({
  description,
  isDescExpanded,
  setIsDescExpanded,
  needsTruncate,
  getShortDescription,
  descRef,
}) => {
  return (
    <section className={styles["description-card"]}>
      <h2>Mô Tả Chi Tiết</h2>
      <div
        id="description-container"
        className={styles["description-container"]}
      >
        <p
          id="post-description"
          ref={descRef}
          className={`${styles["description-text"]} ${isDescExpanded ? styles["expanded"] : styles["collapsed"]}`}
        >
          {isDescExpanded ? description : getShortDescription(description)}
        </p>
      </div>
      {needsTruncate(description) && (
        <button
          id="read-more-btn"
          className={styles["read-more-btn"]}
          onClick={() => setIsDescExpanded(!isDescExpanded)}
        >
          {isDescExpanded ? "Thu gọn" : "Xem thêm..."}
        </button>
      )}
    </section>
  );
};

export default DescriptionCard;
