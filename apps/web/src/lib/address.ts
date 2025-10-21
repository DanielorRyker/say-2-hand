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

export function parseAddress(address: string) {
  const raw = normalizeWhitespace(address || "");
  if (!raw) return { detail: "", ward: "", province: "" };

  const parts = raw
    .split(",")
    .map((p) => normalizeWhitespace(p))
    .filter(Boolean);

  const detail = parts.join(", ");

  return { detail, ward: "", province: "" };
}

export function formatAddress(address: string) {
  const { detail } = parseAddress(address);
  return normalizeWhitespace(detail || "");
}

const AddressUtils = { parseAddress, formatAddress };
export default AddressUtils;
