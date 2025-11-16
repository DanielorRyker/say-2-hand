import React from "react";
import { Icon } from "@iconify/react";
import { formatImageUrl } from "@/lib/constants";
import styles from "./ImageGallery.module.scss";

interface ImageGalleryProps {
  images: Array<{ url: string }>;
  currentImageIndex: number;
  onNavigateImage: (direction: number) => void;
  onSetImage: (index: number) => void;
  onOpenLightbox: (index: number) => void;
  thumbsRef: React.RefObject<HTMLDivElement>;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  currentImageIndex,
  onNavigateImage,
  onSetImage,
  onOpenLightbox,
  thumbsRef,
}) => {
  return (
    <div className={`${styles["gallery-card"]}`}>
      <div
        id="main-image-container"
        className={`${styles["main-image-container"]}`}
        onClick={() => onOpenLightbox(currentImageIndex)}
      >
        <img
          id="main-image"
          src={formatImageUrl(images[currentImageIndex].url)}
          alt="main"
        />
        <div id="image-count" className={`${styles["image-count"]}`}>
          {currentImageIndex + 1}/{images.length}
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

      <div
        id="thumbnail-gallery"
        className={`${styles["thumbs"]}`}
        ref={thumbsRef}
      >
        {images.map((imageUrl: any, idx: number) => (
          <div
            key={idx}
            data-thumb-index={idx}
            className={`${styles["thumb"]} ${
              idx === currentImageIndex ? `${styles["active"]}` : ""
            }`}
            onClick={() => onSetImage(idx)}
          >
            <img src={formatImageUrl(imageUrl.url)} alt={`thumb-${idx}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
