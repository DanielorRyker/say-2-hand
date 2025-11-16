import React from "react";
import styles from "./PostDescription.module.scss";

interface PostDescriptionProps {
  description: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  descRef: React.RefObject<HTMLParagraphElement>;
}

const DESCRIPTION_TRUNCATE = 300;

const PostDescription: React.FC<PostDescriptionProps> = ({
  description,
  isExpanded,
  onToggleExpanded,
  descRef,
}) => {
  const needsTruncate = (text: string) => text.length > DESCRIPTION_TRUNCATE;
  
  const getShortDescription = (text: string) =>
    text.length > DESCRIPTION_TRUNCATE
      ? text.slice(0, DESCRIPTION_TRUNCATE).trimEnd() + "..."
      : text;

  return (
    <section className={`${styles["description-card"]}`}>
      <h2>Mô Tả Chi Tiết</h2>
      <div
        id="description-container"
        className={`${styles["relative"]} ${styles["overflow-hidden"]}`}
      >
        <p
          id="post-description"
          ref={descRef}
          className={`${styles["description-text"]} ${
            isExpanded ? "expanded" : "collapsed"
          }`}
        >
          {isExpanded ? description : getShortDescription(description)}
        </p>
      </div>
      {needsTruncate(description) && (
        <button
          id="read-more-btn"
          className={`${styles["read-more-btn"]}`}
          onClick={onToggleExpanded}
        >
          {isExpanded ? "Thu gọn" : "Xem thêm..."}
        </button>
      )}
    </section>
  );
};

export default PostDescription;
