import React from "react";
import { Icon } from "@iconify/react";
import { formatImageUrl } from "@/lib/constants";
import styles from "./Lightbox.module.scss";

interface LightboxProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onNavigate: (direction: number) => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onNavigate,
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
          onNavigate(-1);
        }}
        aria-label="Lightbox - previous"
      >
        <Icon icon="lucide:chevron-left" width={24} height={24} />
      </button>
      <img
        src={formatImageUrl(imageUrl)}
        alt="lightbox"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className={`${styles["nav-arrow"]} ${styles["right"]}`}
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(1);
        }}
        aria-label="Lightbox - next"
      >
        <Icon icon="lucide:chevron-right" width={24} height={24} />
      </button>
    </div>
  );
};

export default Lightbox;
