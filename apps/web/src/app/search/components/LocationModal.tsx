"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import styles from "./LocationModal.module.scss";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  distance: number;
  setDistance: (distance: number) => void;
}

const POPULAR_LOCATIONS = [
  { value: "hcm", label: "TP. Hồ Chí Minh", icon: "mdi:city" },
  { value: "hanoi", label: "Hà Nội", icon: "mdi:city" },
  { value: "danang", label: "Đà Nẵng", icon: "mdi:city" },
  { value: "cantho", label: "Cần Thơ", icon: "mdi:city" },
  { value: "haiphong", label: "Hải Phòng", icon: "mdi:city" },
  { value: "nhatrang", label: "Nha Trang", icon: "mdi:city" },
];

export default function LocationModal({
  isOpen,
  onClose,
  selectedLocation,
  setSelectedLocation,
  distance,
  setDistance,
}: LocationModalProps) {
  const [customLocation, setCustomLocation] = useState("");

  if (!isOpen) return null;

  const handleSelectLocation = (location: string) => {
    setSelectedLocation(location);
  };

  const handleCustomLocation = () => {
    if (customLocation.trim()) {
      setSelectedLocation(customLocation);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation(
            `${position.coords.latitude},${position.coords.longitude}`
          );
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Không thể lấy vị trí hiện tại");
        }
      );
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <Icon icon="mdi:map-marker" width={24} height={24} />
            Chọn vị trí
          </h2>
          <button className={styles.closeBtn} onClick={onClose} title="Đóng">
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Current Location */}
          <div className={styles.currentLocationSection}>
            <button
              className={styles.currentLocationBtn}
              onClick={getCurrentLocation}
            >
              <Icon icon="mdi:crosshairs-gps" width={20} height={20} />
              Sử dụng vị trí hiện tại
            </button>
          </div>

          {/* Popular Locations */}
          <div className={styles.section}>
            <h3>Địa điểm phổ biến</h3>
            <div className={styles.locationGrid}>
              {POPULAR_LOCATIONS.map((location) => (
                <button
                  key={location.value}
                  className={`${styles.locationCard} ${selectedLocation === location.value ? styles.active : ""}`}
                  onClick={() => handleSelectLocation(location.value)}
                >
                  <Icon icon={location.icon} width={24} height={24} />
                  <span>{location.label}</span>
                  {selectedLocation === location.value && (
                    <Icon
                      icon="mdi:check-circle"
                      width={20}
                      height={20}
                      className={styles.checkIcon}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Location */}
          <div className={styles.section}>
            <h3>Nhập địa chỉ tùy chỉnh</h3>
            <div className={styles.customLocationInput}>
              <input
                type="text"
                placeholder="Nhập địa chỉ, quận, thành phố..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
              />
              <button
                onClick={handleCustomLocation}
                title="Tìm kiếm vị trí"
                aria-label="Tìm kiếm vị trí"
              >
                <Icon icon="mdi:magnify" width={20} height={20} />
              </button>
            </div>
          </div>

          {/* Distance Slider */}
          <div className={styles.section}>
            <h3>
              <Icon icon="mdi:map-marker-radius" width={20} height={20} />
              Khoảng cách: {distance} km
            </h3>
            <input
              type="range"
              min="1"
              max="100"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className={styles.rangeSlider}
              title="Khoảng cách"
              aria-label="Chọn khoảng cách tối đa"
            />
            <div className={styles.rangeLabels}>
              <span>1 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          {selectedLocation && (
            <div className={styles.selectedInfo}>
              <Icon icon="mdi:information" width={20} height={20} />
              <span>
                Vị trí đã chọn: <strong>{selectedLocation}</strong>
              </span>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setSelectedLocation("");
              setCustomLocation("");
            }}
          >
            <Icon icon="mdi:close-circle" width={18} height={18} />
            Xóa chọn
          </button>
          <button className={styles.applyBtn} onClick={onClose}>
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
