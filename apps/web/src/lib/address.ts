// Shared address parsing/formatting utilities
// Goal: produce canonical addresses following rules:
// - Detailed: hẻm/ngõ/.../số nhà/đường first (as specific as possible)
// - Ward-level: Phường / Xã / Thị trấn second
// - Province/City: top-level last
// - Use commas to separate levels, be resilient to messy input and duplicate tokens

export function normalizeWhitespace(s: string) {
  return (s || "").replace(/\s+/g, " ").trim();
}

export function normalizeProvinceToken(s: string) {
  return s.trim();
}

// Normalize province names to canonical forms (keep 'Thành phố' prefix for major cities)
export function normalizeProvinceName(input?: string | null) {
  if (!input) return "";
  const trimmedInput = String(input).trim();
  const lowercaseInput = trimmedInput.toLowerCase();
  // Build a canonical map for cities/provinces including common variants
  // We'll support both accented and diacritic-stripped keys so nominatim or user input
  // without accents will still map correctly.
  function stripDiacritics(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^\S\r\n]+/g, " ")
      .trim();
  }

  const canonicalMap: Record<string, string> = {
    // Major municipalities (Thành phố)
    "thành phố hồ chí minh": "Thành phố Hồ Chí Minh",
    "hồ chí minh": "Thành phố Hồ Chí Minh",
    "ho chi minh": "Thành phố Hồ Chí Minh",
    tphcm: "Thành phố Hồ Chí Minh",
    "tp hcm": "Thành phố Hồ Chí Minh",
    hcm: "Thành phố Hồ Chí Minh",

    "thành phố hà nội": "Thành phố Hà Nội",
    "hà nội": "Thành phố Hà Nội",
    "ha noi": "Thành phố Hà Nội",
    hn: "Thành phố Hà Nội",

    "thành phố đà nẵng": "Thành phố Đà Nẵng",
    "đà nẵng": "Thành phố Đà Nẵng",
    "da nang": "Thành phố Đà Nẵng",

    "thành phố hải phòng": "Thành phố Hải Phòng",
    "hải phòng": "Thành phố Hải Phòng",
    "hai phong": "Thành phố Hải Phòng",

    "thành phố cần thơ": "Thành phố Cần Thơ",
    "cần thơ": "Thành phố Cần Thơ",
    "can tho": "Thành phố Cần Thơ",

    // Other provinces (prefix with 'Tỉnh')
    "lai châu": "Tỉnh Lai Châu",
    "lai chau": "Tỉnh Lai Châu",
    "điện biên": "Tỉnh Điện Biên",
    "dien bien": "Tỉnh Điện Biên",
    "sơn la": "Tỉnh Sơn La",
    "son la": "Tỉnh Sơn La",
    "lạng sơn": "Tỉnh Lạng Sơn",
    "lang son": "Tỉnh Lạng Sơn",
    "quảng ninh": "Tỉnh Quảng Ninh",
    "quang ninh": "Tỉnh Quảng Ninh",
    "thanh hóa": "Tỉnh Thanh Hoá",
    "thanh hoa": "Tỉnh Thanh Hoá",
    "nghệ an": "Tỉnh Nghệ An",
    "nghe an": "Tỉnh Nghệ An",
    "hà tĩnh": "Tỉnh Hà Tĩnh",
    "ha tinh": "Tỉnh Hà Tĩnh",
    "cao bằng": "Tỉnh Cao Bằng",
    "cao bang": "Tỉnh Cao Bằng",
    "tuyên quang": "Tỉnh Tuyên Quang",
    "tuyen quang": "Tỉnh Tuyên Quang",
    "lào cai": "Tỉnh Lào Cai",
    "lao cai": "Tỉnh Lào Cai",
    "thái nguyên": "Tỉnh Thái Nguyên",
    "thai nguyen": "Tỉnh Thái Nguyên",
    "phú thọ": "Tỉnh Phú Thọ",
    "phu tho": "Tỉnh Phú Thọ",
    "bắc ninh": "Tỉnh Bắc Ninh",
    "bac ninh": "Tỉnh Bắc Ninh",
    "hưng yên": "Tỉnh Hưng Yên",
    "hung yen": "Tỉnh Hưng Yên",
    "ninh bình": "Tỉnh Ninh Bình",
    "ninh binh": "Tỉnh Ninh Bình",
    "quảng trị": "Tỉnh Quảng Trị",
    "quang tri": "Tỉnh Quảng Trị",
    "quảng ngãi": "Tỉnh Quảng Ngãi",
    "quang ngai": "Tỉnh Quảng Ngãi",
    "gia lai": "Tỉnh Gia Lai",
    "khánh hòa": "Tỉnh Khánh Hòa",
    "khanh hoa": "Tỉnh Khánh Hòa",
    "lâm đồng": "Tỉnh Lâm Đồng",
    "lam dong": "Tỉnh Lâm Đồng",
    "đắk lắk": "Tỉnh Đắk Lắk",
    "dak lak": "Tỉnh Đắk Lắk",
    "đồng nai": "Tỉnh Đồng Nai",
    "dong nai": "Tỉnh Đồng Nai",
    "tây ninh": "Tỉnh Tây Ninh",
    "tay ninh": "Tỉnh Tây Ninh",
    "vĩnh long": "Tỉnh Vĩnh Long",
    "vinh long": "Tỉnh Vĩnh Long",
    "đồng tháp": "Tỉnh Đồng Tháp",
    "dong thap": "Tỉnh Đồng Tháp",
    "cà mau": "Tỉnh Cà Mau",
    "ca mau": "Tỉnh Cà Mau",
    "an giang": "Tỉnh An Giang",
    // keep existing entries as safe-guards
    "thành phố thủ đức": "Thành phố Hồ Chí Minh",
  } as Record<string, string>;

  const normalizedKey = lowercaseInput.replace(/\s+/g, " ").trim();
  const strippedKey = stripDiacritics(normalizedKey);
  if (canonicalMap[normalizedKey]) return canonicalMap[normalizedKey];
  if (canonicalMap[strippedKey]) return canonicalMap[strippedKey];

  // fallback: prefix with 'Tỉnh' for regular provinces
  function capitalizeWords(text: string) {
    return text
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  }

  const capitalizedName = capitalizeWords(trimmedInput);
  return `Tỉnh ${capitalizedName}`;
}

// Helper: normalize and strip common prefixes like 'Tỉnh', 'Thành phố', 'TP', 'Tp.'
function stripProvincePrefix(token: string) {
  if (!token) return "";
  let tokenText = token;
  // remove common prefixes (case-insensitive)
  tokenText = tokenText.replace(/^tỉnh\s+/i, "");
  tokenText = tokenText.replace(/^thành phố\s+/i, "");
  tokenText = tokenText.replace(/^tp\.?\s*/i, "");
  tokenText = tokenText.replace(/^tp\s*-\s*/i, "");
  tokenText = tokenText.replace(/^thị xã\s+/i, "");
  tokenText = tokenText.replace(/^thị trấn\s+/i, "");
  tokenText = tokenText.replace(/^tt\.?\s*/i, "");
  tokenText = tokenText.replace(/^huyện\s+/i, ""); // Lấy Huyện/Quận làm phần 'detail' hơn là 'province'
  tokenText = tokenText.replace(/^quận\s+/i, "");
  tokenText = tokenText.replace(/^phường\s+/i, "");
  return tokenText.trim();
}

export function parseAddress(address: string) {
  const raw = normalizeWhitespace(address || "");
  if (!raw) return { detail: "", ward: "", province: "" };

  const parts = raw
    .split(",")
    .map((p) => normalizeWhitespace(p))
    .filter(Boolean);

  const detailParts = [...parts];
  let province = "";
  let ward = "";

  // 1. Tách Province (Tỉnh/Thành phố) từ token cuối
  const provinceIndex = detailParts.length - 1;
  if (provinceIndex >= 0) {
    const lastToken = detailParts[provinceIndex] || "";
    // Các từ khóa gợi ý là Tỉnh/Thành phố (ví dụ: Hà Nội, Hồ Chí Minh, Tỉnh)
    if (
      /(thành phố|tp\s*hcm|hồ chí minh|hcm|tỉnh)\b/i.test(lastToken) ||
      (provinceIndex === detailParts.length - 1 && detailParts.length > 1) // token cuối cùng nếu có > 1 token
    ) {
      province = normalizeProvinceName(stripProvincePrefix(lastToken));
      detailParts.pop(); // Loại bỏ province khỏi danh sách
    }
  }

  // 2. Tách Ward/District (Phường/Xã/Thị trấn/Quận/Huyện) từ token mới cuối cùng
  const wardIndex = detailParts.length - 1;
  if (wardIndex >= 0) {
    const lastToken = detailParts[wardIndex] || "";
    // Các từ khóa gợi ý là Ward/District (Phường, Xã, Quận, Huyện, Thị trấn)
    if (
      /\b(phường|xã|thị trấn|p\.?|q\.?|h\.?|tt\.?)\b/i.test(lastToken) ||
      (wardIndex === detailParts.length - 1 && detailParts.length > 1) // token cuối cùng nếu còn > 1 token
    ) {
      ward = normalizeWhitespace(lastToken);
      detailParts.pop(); // Loại bỏ ward/district khỏi danh sách
    }
  }

  // 3. Phần còn lại là Detail (Số nhà, Hẻm, Đường)
  const detail = normalizeWhitespace(detailParts.join(", ") || province); // Nếu không còn gì, lấy tỉnh làm detail (trường hợp hiếm)

  return {
    detail: detail,
    ward: ward,
    province: province,
  };
}

export function formatAddress(address: string) {
  const { detail, ward, province } = parseAddress(address);
  // Canonical format: Detail, Ward/District, Province
  const parts = [detail, ward, province].filter(Boolean);
  return normalizeWhitespace(parts.join(", ") || "");
}

const AddressUtils = { parseAddress, formatAddress };
export default AddressUtils;
