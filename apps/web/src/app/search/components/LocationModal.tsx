"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import styles from "./LocationModal.module.scss";
import { formatAddress, parseAddress } from "../../../lib/address";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  distance: number;
  setDistance: (distance: number) => void;
}

// popular locations removed per UX change

export default function LocationModal({
  isOpen,
  onClose,
  selectedLocation,
  setSelectedLocation,
  distance,
  setDistance,
}: LocationModalProps) {
  const [customLocation, setCustomLocation] = useState("");

  // Posts data used to extract provinces/wards and to compute nearest post
  const [postsMap, setPostsMap] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [wardsByProvince, setWardsByProvince] = useState<
    Record<string, string[]>
  >({});
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");

  // handlers for removed UI elements were removed

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Try to find nearest post from postsMap
          if (postsMap && postsMap.length > 0) {
            const nearest = findNearestPost(lat, lon, postsMap);
            if (nearest) {
              const parsed = parseAddress(nearest.location.address || "");
              if (parsed.province) {
                setSelectedProvince(parsed.province);
                if (parsed.ward) setSelectedWard(parsed.ward);
                setSelectedLocation(
                  formatAddress(nearest.location.address || "")
                );
                return;
              }
            }
          }

          // Fallback: store raw coords
          setSelectedLocation(`${lat},${lon}`);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Không thể lấy vị trí hiện tại");
        }
      );
    }
  };

  // Fetch posts map to build province/ward lists
  useEffect(() => {
    let mounted = true;
    async function fetchPostMap() {
      try {
        const res = await fetch("/api/posts/postmap");
        const data = await res.json();
        if (!mounted) return;
        // keep posts that have geo coordinates and address
        const filtered = (data || []).filter(
          (p: any) =>
            p.location &&
            p.location.geo &&
            p.location.geo.coordinates &&
            p.location.address
        );
        setPostsMap(filtered);

        // build province -> set of wards
        const provSet = new Set<string>();
        const wardMap: Record<string, Set<string>> = {};

        for (const p of filtered) {
          const parsed = parseAddress(p.location.address || "");
          if (parsed.province) {
            provSet.add(parsed.province);
            wardMap[parsed.province] =
              wardMap[parsed.province] || new Set<string>();
            if (parsed.ward) wardMap[parsed.province].add(parsed.ward);
          }
        }

        const provList = Array.from(provSet).sort((a, b) =>
          a.localeCompare(b, "vi")
        );
        const wardsObj: Record<string, string[]> = {};
        for (const prov of provList) {
          wardsObj[prov] = Array.from(wardMap[prov] || []).sort((a, b) =>
            a.localeCompare(b, "vi")
          );
        }

        // set state (defaults chosen from local variables)
        setProvinces(provList);
        setWardsByProvince(wardsObj);
        if (provList.length > 0) {
          setSelectedProvince((prev) => (prev ? prev : provList[0]));
          setSelectedWard((prev) =>
            prev
              ? prev
              : (wardsObj[provList[0]] && wardsObj[provList[0]][0]) || ""
          );
        }
      } catch (err) {
        console.error("Error loading postmap for locations:", err);
      }
    }

    fetchPostMap();
    return () => {
      mounted = false;
    };
  }, []);

  // when province changes, update ward list and pick first
  useEffect(() => {
    if (selectedProvince) {
      const wards = wardsByProvince[selectedProvince] || [];
      setSelectedWard((prev) => (wards.includes(prev) ? prev : wards[0] || ""));
    }
  }, [selectedProvince, wardsByProvince]);

  // Helpers: use shared address utilities

  function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    // returns distance in km
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function findNearestPost(lat: number, lon: number, posts: any[]) {
    let best: any = null;
    let bestDist = Infinity;
    for (const p of posts) {
      const coords = p.location.geo.coordinates; // [lon, lat]
      if (!coords || coords.length < 2) continue;
      const [plon, plat] = coords;
      const d = haversineDistance(lat, lon, plat, plon);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    // only return if reasonably near (e.g., 100 km)
    if (bestDist <= 100) return best;
    return best; // still return best even if far — calling code can decide
  }

  if (!isOpen) return null;

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

          {/* Province & Ward selects (Vietnam post-merge structure) */}
          <div className={styles.section}>
            <h3>
              <Icon icon="mdi:city" width={18} height={18} />
              Chọn Tỉnh / Phường
            </h3>
            <div className={styles.locationSelects}>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                aria-label="Chọn tỉnh"
              >
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                aria-label="Chọn phường"
              >
                {(wardsByProvince[selectedProvince] || []).map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Distance Slider */}
          <div className={styles.section}>
            <h3>
              <Icon icon="mdi:map-marker-radius" width={20} height={20} />
              Khoảng cách: {distance || 50} km
            </h3>
            <input
              type="range"
              min="1"
              max="100"
              value={distance || 50}
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
          <button
            className={styles.applyBtn}
            onClick={() => {
              // prefer selected ward/province -> customLocation -> existing selectedLocation
              if (selectedProvince && selectedWard) {
                setSelectedLocation(`${selectedWard}, ${selectedProvince}`);
              } else if (customLocation.trim()) {
                setSelectedLocation(customLocation);
              }
              onClose();
            }}
          >
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
