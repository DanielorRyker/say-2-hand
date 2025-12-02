// Lightbox.tsx - Component hiển thị lightbox xem ảnh lớn
import React from "react";
import styles from "./Lightbox.module.scss";
import { Icon } from "@iconify/react";

interface LightboxProps {
  isOpen: boolean;
  imageUrls: any[];
  currentImageIndex: number;
  onClose: () => void;
  onNavigateImage: (dir: number) => void;
  formatImageUrl: (url: string) => string;
}

// Component lightbox xem ảnh lớn
const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  imageUrls,
  currentImageIndex,
  onClose,
  onNavigateImage,
  formatImageUrl,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className={`${styles["lightbox"]} ${styles["visible"]}`}
      onClick={onClose}
    >
      <button
        className={`${styles["nav-arrow"]} ${styles["left"]}`}
        onClick={(e) => {
          e.stopPropagation();
          onNavigateImage(-1);
        }}
        aria-label="Lightbox - previous"
      >
        <Icon icon="lucide:chevron-left" width={24} height={24} />
      </button>
      {imageUrls?.[currentImageIndex]?.url ? (
        <img
          src={formatImageUrl(imageUrls[currentImageIndex].url) as string}
          alt="lightbox"
          onClick={(e) => e.stopPropagation()}
        />
      ) : null}
      <button
        className={`${styles["nav-arrow"]} ${styles["right"]}`}
        onClick={(e) => {
          e.stopPropagation();
          onNavigateImage(1);
        }}
        aria-label="Lightbox - next"
      >
        <Icon icon="lucide:chevron-right" width={24} height={24} />
      </button>
    </div>
  );
};

export default Lightbox;
