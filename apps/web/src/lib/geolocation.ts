/**
 * Utility functions cho xử lý geolocation
 */

/**
 * Tính khoảng cách giữa 2 điểm địa lý (Haversine formula)
 * @param lat1 - Vĩ độ điểm 1
 * @param lon1 - Kinh độ điểm 1
 * @param lat2 - Vĩ độ điểm 2
 * @param lon2 - Kinh độ điểm 2
 * @returns Khoảng cách tính bằng km
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Bán kính Trái Đất tính bằng km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Làm tròn đến 1 chữ số thập phân
}

/**
 * Chuyển độ sang radian
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format khoảng cách thành chuỗi hiển thị
 * @param distanceKm - Khoảng cách tính bằng km
 * @returns Chuỗi hiển thị khoảng cách
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm)} km`;
}

/**
 * Lấy vị trí hiện tại của người dùng
 * @returns Promise với {lat, lng} hoặc null nếu không lấy được
 */
export async function getCurrentPosition(): Promise<{
  lat: number;
  lng: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting current position:", error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Lấy vị trí từ localStorage hoặc lấy vị trí hiện tại
 */
export async function getUserLocation(): Promise<{
  lat: number;
  lng: number;
} | null> {
  try {
    // Kiểm tra localStorage trước
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      const parsed = JSON.parse(savedLocation);
      if (
        parsed.lat &&
        parsed.lng &&
        typeof parsed.lat === "number" &&
        typeof parsed.lng === "number"
      ) {
        return parsed;
      }
    }

    // Nếu không có, lấy vị trí hiện tại
    const currentPos = await getCurrentPosition();
    if (currentPos) {
      // Lưu vào localStorage
      localStorage.setItem("userLocation", JSON.stringify(currentPos));
      return currentPos;
    }

    return null;
  } catch (error) {
    console.error("Error getting user location:", error);
    return null;
  }
}

/**
 * Tính khoảng cách từ vị trí người dùng đến một địa điểm
 */
export function calculateDistanceFromUser(
  userLocation: { lat: number; lng: number } | null,
  targetLocation: { coordinates: [number, number] } | undefined
): number | null {
  if (!userLocation || !targetLocation?.coordinates) {
    return null;
  }

  const [targetLng, targetLat] = targetLocation.coordinates;
  return calculateDistance(
    userLocation.lat,
    userLocation.lng,
    targetLat,
    targetLng
  );
}
