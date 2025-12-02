/**
 * Category Color System
 * Hệ thống màu sắc cho categories theo design system
 */

export interface CategoryColor {
  gradient: string;
  solid: string;
  light: string;
  name: string;
}

// Mapping từ category slug/name sang color scheme
const CATEGORY_COLOR_MAP: Record<string, CategoryColor> = {
  // Điện tử & Công nghệ
  electronics: {
    name: "Điện tử",
    gradient: "linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)",
    solid: "#8b5cf6",
    light: "#f5f3ff",
  },
  "dien-tu": {
    name: "Điện tử",
    gradient: "linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)",
    solid: "#8b5cf6",
    light: "#f5f3ff",
  },

  // Thời trang
  fashion: {
    name: "Thời trang",
    gradient: "linear-gradient(90deg, #ec4899 0%, #db2777 100%)",
    solid: "#ec4899",
    light: "#fdf2f8",
  },
  "thoi-trang": {
    name: "Thời trang",
    gradient: "linear-gradient(90deg, #ec4899 0%, #db2777 100%)",
    solid: "#ec4899",
    light: "#fdf2f8",
  },

  // Nhà cửa & Đời sống
  home: {
    name: "Nhà cửa",
    gradient: "linear-gradient(90deg, #f97316 0%, #ea580c 100%)",
    solid: "#f97316",
    light: "#fff7ed",
  },
  "nha-cua": {
    name: "Nhà cửa",
    gradient: "linear-gradient(90deg, #f97316 0%, #ea580c 100%)",
    solid: "#f97316",
    light: "#fff7ed",
  },

  // Sách & Văn phòng phẩm
  books: {
    name: "Sách",
    gradient: "linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)",
    solid: "#06b6d4",
    light: "#ecfeff",
  },
  sach: {
    name: "Sách",
    gradient: "linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)",
    solid: "#06b6d4",
    light: "#ecfeff",
  },

  // Thể thao & Dụng cụ thể thao
  sports: {
    name: "Thể thao",
    gradient: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
    solid: "#10b981",
    light: "#d1fae5",
  },
  "the-thao": {
    name: "Thể thao",
    gradient: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
    solid: "#10b981",
    light: "#d1fae5",
  },

  // Xe cộ
  vehicles: {
    name: "Xe cộ",
    gradient: "linear-gradient(90deg, #64748b 0%, #475569 100%)",
    solid: "#64748b",
    light: "#f8fafc",
  },
  "xe-co": {
    name: "Xe cộ",
    gradient: "linear-gradient(90deg, #64748b 0%, #475569 100%)",
    solid: "#64748b",
    light: "#f8fafc",
  },

  // Đồ chơi
  toys: {
    name: "Đồ chơi",
    gradient: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
    solid: "#f59e0b",
    light: "#fef3c7",
  },
  "do-choi": {
    name: "Đồ chơi",
    gradient: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)",
    solid: "#f59e0b",
    light: "#fef3c7",
  },

  // Làm đẹp & Sức khỏe
  beauty: {
    name: "Làm đẹp",
    gradient: "linear-gradient(90deg, #ec4899 0%, #f472b6 100%)",
    solid: "#ec4899",
    light: "#fce7f3",
  },
  "lam-dep": {
    name: "Làm đẹp",
    gradient: "linear-gradient(90deg, #ec4899 0%, #f472b6 100%)",
    solid: "#ec4899",
    light: "#fce7f3",
  },

  // Thực phẩm
  food: {
    name: "Thực phẩm",
    gradient: "linear-gradient(90deg, #84cc16 0%, #65a30d 100%)",
    solid: "#84cc16",
    light: "#f7fee7",
  },
  "thuc-pham": {
    name: "Thực phẩm",
    gradient: "linear-gradient(90deg, #84cc16 0%, #65a30d 100%)",
    solid: "#84cc16",
    light: "#f7fee7",
  },

  // Thú cưng
  pets: {
    name: "Thú cưng",
    gradient: "linear-gradient(90deg, #f97316 0%, #fb923c 100%)",
    solid: "#f97316",
    light: "#ffedd5",
  },
  "thu-cung": {
    name: "Thú cưng",
    gradient: "linear-gradient(90deg, #f97316 0%, #fb923c 100%)",
    solid: "#f97316",
    light: "#ffedd5",
  },
};

// Default color scheme cho categories không match
const DEFAULT_CATEGORY_COLOR: CategoryColor = {
  name: "Khác",
  gradient: "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)",
  solid: "#94a3b8",
  light: "#f1f5f9",
};

/**
 * Lấy color scheme cho category dựa trên slug hoặc name
 * @param categorySlug - Slug của category (vd: "dien-tu", "thoi-trang")
 * @returns CategoryColor object chứa gradient, solid, light colors
 */
export function getCategoryColor(categorySlug?: string): CategoryColor {
  if (!categorySlug) return DEFAULT_CATEGORY_COLOR;

  const normalized = categorySlug.toLowerCase().trim();
  return CATEGORY_COLOR_MAP[normalized] || DEFAULT_CATEGORY_COLOR;
}

/**
 * Lấy inline style object cho category badge
 * @param categorySlug - Slug của category
 * @returns React CSSProperties object
 */
export function getCategoryBadgeStyle(
  categorySlug?: string
): React.CSSProperties {
  const color = getCategoryColor(categorySlug);
  return {
    background: color.light,
    color: color.solid,
    borderColor: color.solid,
  };
}

/**
 * Lấy gradient background cho category banner/header
 * @param categorySlug - Slug của category
 * @returns CSS gradient string
 */
export function getCategoryGradient(categorySlug?: string): string {
  return getCategoryColor(categorySlug).gradient;
}
