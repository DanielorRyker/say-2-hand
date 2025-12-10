// Gallery.tsx - Component hiển thị gallery ảnh sản phẩm
import React from "react";
import styles from "./Gallery.module.scss";
import { Icon } from "@iconify/react";

interface GalleryProps {
  imageUrls: any[];
  currentImageIndex: number;
  onSetImage: (idx: number) => void;
  onOpenLightbox: (idx: number) => void;
  onNavigateImage: (dir: number) => void;
  thumbsRef: React.RefObject<HTMLDivElement | null>;
  formatImageUrl: (url: string | undefined | null) => string | null;
}

// Component gallery ảnh sản phẩm
const Gallery: React.FC<GalleryProps> = ({
  imageUrls,
  currentImageIndex,
  onSetImage,
  onOpenLightbox,
  onNavigateImage,
  thumbsRef,
  formatImageUrl,
}) => {
  return (
    <div className={styles["gallery-card"]}>
      <div
        id="main-image-container"
        className={styles["main-image-container"]}
        onClick={() => onOpenLightbox(currentImageIndex)}
      >
        {/* Hiển thị ảnh chính */}
        {imageUrls?.[currentImageIndex]?.url ? (
          <img
            id="main-image"
            src={formatImageUrl(imageUrls[currentImageIndex].url) as string}
            alt="main"
          />
        ) : (
          <div>Không có ảnh</div>
        )}
        <div id="image-count" className={styles["image-count"]}>
          {imageUrls?.length
            ? `${currentImageIndex + 1}/${imageUrls.length}`
            : "0/0"}
        </div>
        <button
          className={`${styles["nav-arrow"]} ${styles["left"]}`}
          onClick={(e) => {
            e.stopPropagation();
            onNavigateImage(-1);
          }}
          aria-label="Ảnh trước"
        >
          <Icon icon="lucide:chevron-left" width={18} height={18} />
        </button>
        <button
          className={`${styles["nav-arrow"]} ${styles["right"]}`}
          onClick={(e) => {
            e.stopPropagation();
            onNavigateImage(1);
          }}
          aria-label="Ảnh sau"
        >
          <Icon icon="lucide:chevron-right" width={18} height={18} />
        </button>
      </div>
      <div id="thumbnail-gallery" className={styles["thumbs"]} ref={thumbsRef}>
        {imageUrls?.length > 0 &&
          imageUrls.map((imageUrl: any, idx: number) => (
            <div
              key={idx}
              data-thumb-index={idx}
              className={`${styles["thumb"]} ${idx === currentImageIndex ? styles["active"] : ""}`}
              onClick={() => onSetImage(idx)}
            >
              <img
                src={formatImageUrl(imageUrl.url) as string}
                alt={`thumb-${idx}`}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default Gallery;
