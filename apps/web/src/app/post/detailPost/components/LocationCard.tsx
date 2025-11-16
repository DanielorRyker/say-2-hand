import React from "react";
import { Icon } from "@iconify/react";
import styles from "./LocationCard.module.scss";

interface LocationCardProps {
  addressText: string;
}

const LocationCard: React.FC<LocationCardProps> = ({ addressText }) => {
  return (
    <div className={`${styles["cta-box"]}`}>
      <div className={`${styles["location-header"]}`}>
        <Icon
          className="icon-location"
          icon="lucide:map-pin"
          width={24}
          height={24}
        />
        <p>Địa Chỉ Giao Dịch</p>
      </div>
      <p className={`${styles["muted-text"]}`}>{addressText}</p>
      <div className={`${styles["map-mock"]}`}>Xem trên Bản đồ</div>
    </div>
  );
};

export default LocationCard;
