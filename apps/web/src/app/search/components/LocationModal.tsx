"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import styles from "./LocationModal.module.scss";
import { API_BASE } from "@/lib/constants";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  distance: number;
  setDistance: (distance: number) => void;
  setSelectedProvinceName?: (name: string) => void;
  setSelectedWardName?: (name: string) => void;
  initialProvinceCode?: number; // ✅ Để sync province từ URL khi refresh
}

interface Province {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  phone_code: number;
}

interface Ward {
  code: number;
  name: string;
  division_type: string;
  codename: string;
  province_code: number;
}

export default function LocationModal({
  isOpen,
  onClose,
  setSelectedLocation,
  distance,
  setDistance,
  setSelectedProvinceName,
  setSelectedWardName,
  initialProvinceCode, // ✅ Province code từ URL (khi refresh)
}: LocationModalProps) {
  // States for provinces API
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number>(
    initialProvinceCode || 0 // ✅ Sử dụng initial code nếu có
  );
  const [selectedWardCode, setSelectedWardCode] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);

  // Fetch all provinces on mount
  useEffect(() => {
    let mounted = true;
    async function fetchProvinces() {
      try {
        setLoading(true);
        const res = await axios.get<Province[]>(
          "https://provinces.open-api.vn/api/v2/p/"
        ); // Đảm bảo sử dụng HTTPS
        if (!mounted) return;
        setProvinces(res.data || []);

        // ✅ KHÔNG tự động detect GPS khi vào modal nữa
        // Chỉ đồng bộ tên tỉnh nếu có initialProvinceCode
        if (initialProvinceCode) {
          const initialProvince = res.data.find(
            (p) => p.code === initialProvinceCode
          );
          if (initialProvince && setSelectedProvinceName) {
            setSelectedProvinceName(initialProvince.name);
          }
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProvinces();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProvinceCode]); // ✅ Re-run khi initialProvinceCode thay đổi

  // Fetch wards when province changes
  useEffect(() => {
    if (!selectedProvinceCode) return;

    let mounted = true;
    async function fetchWards() {
      try {
        setLoading(true);
        const res = await axios.get<{ wards: Ward[] }>(
          `https://provinces.open-api.vn/api/v2/p/${selectedProvinceCode}?depth=2`
        );
        if (!mounted) return;
        setWards(res.data.wards || []);
        // Set default to first ward if not already set
        if (res.data.wards && res.data.wards.length > 0 && !selectedWardCode) {
          setSelectedWardCode(res.data.wards[0].code);
        }
      } catch (error) {
        console.error("Error fetching wards:", error);
        setWards([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchWards();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceCode]);

  // Helper function to normalize Vietnamese text for comparison
  const normalizeVietnameseText = (text: string): string => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[đĐ]/g, "d")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Hàm chuẩn hóa địa chỉ VN bằng AI theo cải cách hành chính 07/2025
  // SAU 07/2025: Việt Nam CHỈ CÒN 2 CẤP hành chính:
  // 1. Cấp Tỉnh: Tỉnh/Thành phố trực thuộc TW
  // 2. Cấp cơ sở: Phường/Xã/Thị trấn
  // XÓA BỎ: Quận, Huyện, Thành phố trực thuộc (Thủ Đức, Thuận An, Dĩ An...)
  const normalizeAddressWithAI = async (
    rawAddress: string,
    lat?: number,
    lon?: number
  ): Promise<{
    province?: string;
    ward?: string;
    confidence: number;
  } | null> => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/gemini/normalize-address`,
        {
          address: rawAddress,
          lat,
          lon,
        }
      );

      if (response.data && response.data.province) {
        return {
          province: response.data.province,
          ward: response.data.ward,
          confidence: response.data.confidence || 0,
        };
      }

      return null;
    } catch (error) {
      console.error("❌ AI normalization failed:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);
      }
      return null;
    }
  };

  // Auto-detect current location

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị");
      return;
    }

    setAutoDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Reverse geocoding using Nominatim with higher zoom for better accuracy
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );

          const data = response.data;
          const address = data.address || {};

          // SAU SÁP NHẬP 07/2025: Việt Nam chỉ còn 2 cấp (Tỉnh/TP → Phường/Xã)
          // Nominatim vẫn dùng cấu trúc cũ (city, district, county...)
          // → PHẢI DỰA HOÀN TOÀN VÀO AI để chuẩn hóa theo cấu trúc mới

          const rawAddress = data.display_name || "";

          // Xây dựng địa chỉ tiếng Việt từ các trường Nominatim để AI dễ hiểu hơn
          const vietnameseAddressParts = [
            address.road,
            address.suburb || address.neighbourhood || address.quarter,
            address.city || address.town || address.village,
            address.county,
            address.state || address.province,
            address.country === "Việt Nam" ? "Việt Nam" : address.country,
          ].filter(Boolean);

          const enhancedAddress =
            vietnameseAddressParts.length > 0
              ? vietnameseAddressParts.join(", ")
              : rawAddress;

          const aiResult = await normalizeAddressWithAI(
            enhancedAddress,
            latitude,
            longitude
          );

          console.log("🤖 Manual - AI normalization result:", aiResult);

          // LUÔN ƯU TIÊN AI vì chỉ AI mới hiểu cấu trúc VN sau 07/2025
          let detectedProvinceName = "";
          let detectedWard = "";

          if (aiResult && aiResult.province) {
            // ✅ Dùng kết quả từ AI (cấu trúc 2025: chỉ Tỉnh và Phường/Xã)
            detectedProvinceName = aiResult.province;
            detectedWard = aiResult.ward || "";
          } else {
            // ⚠️ AI thất bại - Dùng Nominatim nhưng CẨN THẬN vì cấu trúc cũ
            console.warn(
              "⚠️ Manual - AI failed! Using Nominatim (old structure, may be inaccurate)"
            );

            detectedProvinceName =
              address.state ||
              address.province ||
              address.county ||
              address.city ||
              "";

            detectedWard =
              address.suburb ||
              address.neighbourhood ||
              address.quarter ||
              address.village ||
              address.hamlet ||
              "";

            console.warn("⚠️ Manual - Nominatim fallback (unreliable):", {
              detectedProvinceName,
              detectedWard,
            });
          }

          if (detectedProvinceName && provinces.length > 0) {
            // Improved matching: try exact match first, then fuzzy match
            let matchedProvince = provinces.find((p) => {
              const normalizedProvince = normalizeVietnameseText(p.name);
              const normalizedDetected =
                normalizeVietnameseText(detectedProvinceName);
              // Exact match
              return normalizedProvince === normalizedDetected;
            });

            // If no exact match, try contains match
            if (!matchedProvince) {
              matchedProvince = provinces.find((p) => {
                const normalizedProvince = normalizeVietnameseText(p.name);
                const normalizedDetected =
                  normalizeVietnameseText(detectedProvinceName);
                return (
                  normalizedProvince.includes(normalizedDetected) ||
                  normalizedDetected.includes(normalizedProvince)
                );
              });
            }

            if (matchedProvince) {
              setSelectedProvinceCode(matchedProvince.code);

              // ✅ Cập nhật chip province bên ngoài ngay lập tức
              if (setSelectedProvinceName) {
                setSelectedProvinceName(matchedProvince.name);
              }

              // Try to match ward/commune
              console.log("Detected ward:", detectedWard); // Debug log

              if (detectedWard) {
                // Fetch wards for this province
                try {
                  const wardsRes = await axios.get<{ wards: Ward[] }>(
                    `https://provinces.open-api.vn/api/v2/p/${matchedProvince.code}?depth=2`
                  );

                  const wardsList = wardsRes.data.wards || [];
                  console.log("Available wards:", wardsList.length); // Debug log

                  // Try exact match first
                  let matchedWard = wardsList.find((w) => {
                    const normalizedWard = normalizeVietnameseText(w.name);
                    const normalizedDetected =
                      normalizeVietnameseText(detectedWard);
                    return normalizedWard === normalizedDetected;
                  });

                  // If no exact match, try contains match
                  if (!matchedWard) {
                    matchedWard = wardsList.find((w) => {
                      const normalizedWard = normalizeVietnameseText(w.name);
                      const normalizedDetected =
                        normalizeVietnameseText(detectedWard);
                      return (
                        normalizedWard.includes(normalizedDetected) ||
                        normalizedDetected.includes(normalizedWard)
                      );
                    });
                  }

                  if (matchedWard) {
                    console.log("Matched ward:", matchedWard.name); // Debug log
                    setSelectedWardCode(matchedWard.code);
                    setSelectedLocation(
                      `${matchedWard.name}, ${matchedProvince.name}`
                    );
                    // ✅ Cập nhật chip ward bên ngoài
                    if (setSelectedWardName) {
                      setSelectedWardName(matchedWard.name);
                    }
                  } else {
                    console.log("No ward matched, using province only"); // Debug log
                    setSelectedLocation(matchedProvince.name);
                    // Không có ward → chỉ hiển thị province chip
                  }
                } catch (err) {
                  console.error("Error fetching wards:", err);
                  setSelectedLocation(matchedProvince.name);
                }
              } else {
                console.log("No ward detected, using province only"); // Debug log
                setSelectedLocation(matchedProvince.name);
              }
            } else {
              console.log("No province matched"); // Debug log
              alert(`Không tìm thấy tỉnh/thành phố: ${detectedProvinceName}`);
            }
          } else {
            console.log("No province detected from Nominatim"); // Debug log
            alert("Không thể xác định tỉnh/thành phố từ vị trí hiện tại");
          }
        } catch (error) {
          console.error("Error getting location:", error);
          alert("Không thể lấy vị trí hiện tại");
        } finally {
          setAutoDetecting(false);
        }
      },
      (error) => {
        // Xử lý các loại lỗi geolocation với thông báo thân thiện
        let errorMessage = "Không thể lấy vị trí hiện tại";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.";
            console.warn("⚠️ Manual geolocation: Permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Thông tin vị trí không khả dụng. Vui lòng kiểm tra kết nối GPS/WiFi.";
            console.warn("⚠️ Manual geolocation: Position unavailable");
            break;
          case error.TIMEOUT:
            errorMessage = "Hết thời gian chờ lấy vị trí. Vui lòng thử lại.";
            console.warn("⚠️ Manual geolocation: Timeout");
            break;
          default:
            console.warn(
              "⚠️ Manual geolocation unknown error:",
              error.message || error
            );
            break;
        }

        // Hiển thị thông báo cho user (vì đây là hành động manual)
        alert(errorMessage);
        setAutoDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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
              disabled={autoDetecting || loading}
            >
              <Icon icon="mdi:crosshairs-gps" width={20} height={20} />
              {autoDetecting
                ? "Đang xác định vị trí..."
                : "Sử dụng vị trí hiện tại"}
            </button>
          </div>

          {/* Province & Ward selects (Vietnam post-merge structure) */}
          <div className={styles.section}>
            {/* Hàng 1: Chọn tỉnh/thành */}
            <div className={styles.provinceRow}>
              <span>Chọn tỉnh/thành</span>
              <select
                value={selectedProvinceCode}
                onChange={(e) => {
                  const code = Number(e.target.value);
                  setSelectedProvinceCode(code);
                  // Cập nhật tên tỉnh cho chip bên ngoài
                  const province = provinces.find((p) => p.code === code);
                  if (setSelectedProvinceName) {
                    setSelectedProvinceName(
                      code === 0 ? "" : province?.name || ""
                    );
                  }
                  // Reset phường khi đổi tỉnh
                  setSelectedWardCode(0);
                  if (setSelectedWardName) {
                    setSelectedWardName("");
                  }
                }}
                aria-label="Chọn tỉnh/thành phố"
                disabled={loading}
              >
                <option value={0}>Tất cả tỉnh/thành phố</option>
                {provinces.length === 0 ? (
                  <option value={0} disabled>
                    Đang tải...
                  </option>
                ) : (
                  provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {/* Hàng 2: Chọn phường/xã */}
            <div className={styles.wardRow}>
              <span>Chọn phường/xã</span>
              <select
                value={selectedWardCode}
                onChange={(e) => {
                  const code = Number(e.target.value);
                  setSelectedWardCode(code);
                  // Cập nhật tên phường cho chip bên ngoài
                  const ward = wards.find((w) => w.code === code);
                  if (setSelectedWardName) {
                    setSelectedWardName(code === 0 ? "" : ward?.name || "");
                  }
                }}
                aria-label="Chọn phường/xã/đặc khu"
                disabled={
                  loading || wards.length === 0 || selectedProvinceCode === 0
                }
              >
                <option value={0}>Tất cả phường/xã</option>
                {wards.length === 0 ? (
                  <option value={0} disabled>
                    {selectedProvinceCode === 0
                      ? "Chọn tỉnh trước"
                      : "Đang tải..."}
                  </option>
                ) : (
                  wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))
                )}
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

          {/* Đã xoá phần hiển thị thông tin 'Vị trí đã chọn' */}
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setSelectedLocation("");
              setDistance(50);
              if (provinces.length > 0) {
                setSelectedProvinceCode(0); // Set to "Tất cả"
              }
              setSelectedWardCode(0);
              // Clear external chips
              if (setSelectedProvinceName) {
                setSelectedProvinceName("");
              }
              if (setSelectedWardName) {
                setSelectedWardName("");
              }
            }}
          >
            <Icon icon="mdi:close-circle" width={18} height={18} />
            Xóa chọn
          </button>
          <button
            className={styles.applyBtn}
            onClick={() => {
              // Build location string from selected province and ward
              const province = provinces.find(
                (p) => p.code === selectedProvinceCode
              );
              const ward = wards.find((w) => w.code === selectedWardCode);

              if (province && ward) {
                setSelectedLocation(`${ward.name}, ${province.name}`);
              } else if (province) {
                setSelectedLocation(province.name);
              }
              onClose();
            }}
            disabled={loading}
          >
            <Icon icon="mdi:check" width={18} height={18} />
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
