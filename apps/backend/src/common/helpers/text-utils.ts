/**
 * Utility functions cho xử lý text tiếng Việt
 */

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu sang không dấu
 * @param str - Chuỗi cần chuyển đổi
 * @returns Chuỗi đã được chuyển đổi không dấu
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';

  str = str.toLowerCase();

  // Bảng chuyển đổi các ký tự có dấu sang không dấu
  const from =
    'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
  const to =
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooooooouuuuuuuuuuuyyyyyd';

  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from[i], 'g'), to[i]);
  }

  return str;
}

/**
 * Tạo normalized text cho tìm kiếm (không dấu, trim, lowercase)
 * @param str - Chuỗi cần normalize
 * @returns Chuỗi đã normalize
 */
export function normalizeSearchText(str: string): string {
  if (!str) return '';

  return removeVietnameseTones(str).trim().replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Tạo search query cho MongoDB với hỗ trợ tiếng Việt không dấu
 * @param searchTerm - Từ khóa tìm kiếm
 * @returns Object query cho MongoDB
 */
export function createVietnameseSearchQuery(searchTerm: string) {
  if (!searchTerm) return {};

  const normalizedTerm = normalizeSearchText(searchTerm);
  const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return {
    $or: [
      { title: { $regex: escapedTerm, $options: 'i' } },
      { description: { $regex: escapedTerm, $options: 'i' } },
      { tags: { $regex: escapedTerm, $options: 'i' } },
      { title_normalized: { $regex: escapedTerm, $options: 'i' } },
      { description_normalized: { $regex: escapedTerm, $options: 'i' } },
    ],
  };
}

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
  lon2: number,
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
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}
