// LocationBox.tsx - Component hiển thị địa chỉ giao dịch và bản đồ
import React from "react";
import styles from "./LocationBox.module.scss";
import { Icon } from "@iconify/react";

interface LocationBoxProps {
  address: string;
}

// Component hiển thị địa chỉ giao dịch và bản đồ
const LocationBox: React.FC<LocationBoxProps> = ({ address }) => {
  return (
    <div className={styles["cta-box"]}>
      <div className={styles["location-header"]}>
        <Icon
          className="icon-location"
          icon="lucide:map-pin"
          width={24}
          height={24}
        />
        <p>Địa Chỉ Giao Dịch</p>
      </div>
      <p className={styles["muted-text"]}>{address}</p>
      <div className={styles["map-mock"]}>Xem trên Bản đồ</div>
    </div>
  );
};

export default LocationBox;
