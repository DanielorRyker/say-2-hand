"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./search.module.scss";
import { parseAddress } from "@/lib/address";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
import FilterModal from "./components/FilterModal";
import CategoryModal from "./components/CategoryModal";
import ConditionModal from "./components/ConditionModal";
import LocationModal from "./components/LocationModal";
import PriceRangeModal from "./components/PriceRangeModal";
import ListPost from "@/app/home/component/ListPost";

type Post = {
  _id: string;
  title: string;
  description: string;
  images: {
    _id: string;
    url: string;
    alt?: string;
    tags: string[];
  }[];
  condition: string;
  transaction_type: string;
  price: number;
  location: {
    address: string;
    geo?: {
      type: string;
      coordinates: [number, number];
    };
  };
  custom_fields?: Record<string, string>;
  tags?: string[];
  status: string;
  stats?: {
    _id?: string;
    view_count: number;
    favorite_count: number;
    chat_count?: number;
  };
  moderation?: {
    _id: string;
  };
  author_id: {
    _id: string;
    full_name: string;
    avatar: string;
  };
  category_id?: {
    _id?: string;
    name?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  reputation?: {
    average_score: number;
    total_ratings: number;
  };
  distance_km?: number;
};

const CONDITION_MAP: Record<string, { text: string; colorKey: string }> = {
  new: { text: "Mới 100%", colorKey: "new" },
  like_new: { text: "Gần như mới", colorKey: "like_new" },
  used: { text: "Đã sử dụng", colorKey: "used" },
  minor_flaw: { text: "Hư nhẹ", colorKey: "minor_flaw" },
  for_repair: { text: "Cần sửa chữa", colorKey: "for_repair" },
  for_parts: { text: "Đã hư", colorKey: "for_parts" },
};

const TRANSACTION_TYPE_MAP: Record<string, string> = {
  sell: "Bán",
  exchange: "Trao đổi",
  give_away: "Tặng",
  "give away": "Tặng",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất", icon: "mdi:clock-outline" },
  { value: "nearest", label: "Gần nhất", icon: "mdi:map-marker" },
  { value: "price_asc", label: "Giá thấp đến cao", icon: "mdi:arrow-up" },
  { value: "price_desc", label: "Giá cao đến thấp", icon: "mdi:arrow-down" },
  { value: "province_asc", label: "Tỉnh (A→Z)", icon: "mdi:alphabetical" },
  { value: "province_desc", label: "Tỉnh (Z→A)", icon: "mdi:alphabetical" },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [postsData, setPostsData] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Enhanced category type với parent_id để support hierarchy
  interface CategoryData {
    _id: string;
    name: string;
    parent_id?: string | null;
    slug?: string;
    icon?: string;
    image?: string;
  }

  const [categories, setCategories] = useState<CategoryData[]>([]);

  // Filter states - lấy từ URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filterProvinceParam, setFilterProvinceParam] = useState<string | null>(
    searchParams.get("province")
  );
  const [selectedTransactionTypes, setSelectedTransactionTypes] = useState<
    string[]
  >([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 100000000,
  });
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>("");
  const [selectedWardName, setSelectedWardName] = useState<string>("");
  const [distance, setDistance] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showListView, setShowListView] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Modal states
  const [showMainFilterModal, setShowMainFilterModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Sync search query và category từ URL
  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);

    // ✅ Đồng bộ category từ URL parameter
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }

    const prov = searchParams.get("province");
    setFilterProvinceParam(prov);

    // if province param present, reflect it in selectedLocation so UI shows active location chip
    if (prov) {
      // clean common prefixes like "tỉnh", "thành phố", "tp" so it matches parsed addresses
      const cleaned = prov
        .replace(/t[h|h\u00E0]nh\s*ph[o|ố]\s*/i, "")
        .replace(/tinh\s*/i, "")
        .replace(/\btp\.?\s*/i, "")
        .trim();
      setSelectedLocation(cleaned || prov);

      // ✅ Đồng bộ với chip bên ngoài (từ Header hoặc URL)
      setSelectedProvinceName(prov);

      // ensure list view is visible and scroll to it
      setShowListView(true);
      // scroll after a tick so DOM exists
      setTimeout(() => {
        if (listRef.current)
          listRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 120);
    }
  }, [searchParams]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiClient.get("/categories");

        // Kiểm tra nếu response là JSON
        if (res.data && typeof res.data === "object") {
          setCategories(res.data);
        } else {
          console.error("Invalid response format from categories API");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Set empty array nếu lỗi
        setCategories([]);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setIsLoading(true);
        const res = await apiClient.get("/posts/postmap");

        // Kiểm tra nếu response là JSON
        if (res.data && Array.isArray(res.data)) {
          setPostsData(res.data);
          setFilteredPosts(res.data);
        } else {
          console.error("Invalid response format from posts API");
          setPostsData([]);
          setFilteredPosts([]);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPostsData([]);
        setFilteredPosts([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const applyFilters = React.useCallback(() => {
    let filtered = [...postsData];

    // Helper function for Vietnamese text normalization
    const normalizeForCompare = (s: string) =>
      s
        ? s
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .trim()
        : "";

    // ==========================================
    // FILTER BY PROVINCE (Tỉnh/Thành phố) - SAU SÁP NHẬP 07/2025
    // ==========================================
    if (selectedProvinceName) {
      const provinceNorm = normalizeForCompare(selectedProvinceName);
      filtered = filtered.filter((post) => {
        const parsed = parseAddress(post.location?.address || "");
        const provNorm = normalizeForCompare(parsed.province || "");
        return provNorm && provNorm === provinceNorm;
      });
    }
    // Legacy province filter from URL (for backward compatibility)
    else if (filterProvinceParam) {
      const provinceParam = filterProvinceParam.trim();
      const provinceParamClean = provinceParam
        .replace(/t[h|h\u00E0]nh\s*ph[o|ố]\s*/i, "")
        .replace(/tinh\s*/i, "")
        .replace(/\btp\.?\s*/i, "")
        .trim();
      const provinceParamNorm = normalizeForCompare(
        provinceParamClean || provinceParam
      );
      if (provinceParamNorm) {
        filtered = filtered.filter((post) => {
          const parsed = parseAddress(post.location?.address || "");
          const provNorm = normalizeForCompare(parsed.province || "");
          return provNorm && provNorm === provinceParamNorm;
        });
      }
    }

    // ==========================================
    // FILTER BY WARD (Phường/Xã/Đặc khu) - SAU SÁP NHẬP 07/2025
    // ==========================================
    if (selectedWardName) {
      const wardNorm = normalizeForCompare(selectedWardName);
      filtered = filtered.filter((post) => {
        const parsed = parseAddress(post.location?.address || "");
        const postWardNorm = normalizeForCompare(parsed.ward || "");
        return postWardNorm && postWardNorm === wardNorm;
      });
    }

    // ==========================================
    // FILTER BY DISTANCE (if selectedLocation is set with coordinates)
    // ==========================================
    // Note: distance filter currently depends on selectedLocation with lat/lon
    // This will need geolocation coordinates to work properly
    // For now, we'll keep it as is for backward compatibility
    if (selectedLocation && distance > 0) {
      // Distance filtering requires coordinates in post data
      // This is placeholder logic - adjust based on your coordinate storage
      filtered = filtered.filter((post) => {
        if (!post.location?.geo?.coordinates) return true; // Keep posts without coordinates
        // Add distance calculation logic here if needed
        return true;
      });
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Transaction types
    if (selectedTransactionTypes.length > 0) {
      filtered = filtered.filter((post) =>
        selectedTransactionTypes.includes(post.transaction_type)
      );
    }

    // Conditions
    if (selectedConditions.length > 0) {
      filtered = filtered.filter((post) =>
        selectedConditions.includes(post.condition)
      );
    }

    // ==========================================
    // FILTER BY CATEGORIES (Parent & Child support)
    // ==========================================
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((post) => {
        if (!post.category_id?._id) return false;

        const postCategoryId = post.category_id._id;

        // Kiểm tra xem post category có trong danh sách selected không
        if (selectedCategories.includes(postCategoryId)) {
          return true;
        }

        // Kiểm tra xem post category có phải là child của category đã chọn không
        // Find category info từ categories state
        const postCategory = categories.find((c) => c._id === postCategoryId);
        if (postCategory && "parent_id" in postCategory) {
          const parent_id = (postCategory as any).parent_id;
          if (parent_id && selectedCategories.includes(parent_id)) {
            return true;
          }
        }

        return false;
      });
    }

    // Price range
    filtered = filtered.filter((post) => {
      if (post.transaction_type === "sell") {
        return post.price >= priceRange.min && post.price <= priceRange.max;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "nearest":
        filtered.sort(
          (a, b) => (a.distance_km || 999) - (b.distance_km || 999)
        );
        break;
      case "price_asc":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "province_asc":
        filtered.sort((a, b) => {
          const pa = parseAddress(a.location?.address || "").province || "";
          const pb = parseAddress(b.location?.address || "").province || "";
          return pa.localeCompare(pb, "vi");
        });
        break;
      case "province_desc":
        filtered.sort((a, b) => {
          const pa = parseAddress(a.location?.address || "").province || "";
          const pb = parseAddress(b.location?.address || "").province || "";
          return pb.localeCompare(pa, "vi");
        });
        break;
    }

    setFilteredPosts(filtered);
  }, [
    postsData,
    searchQuery,
    selectedTransactionTypes,
    selectedConditions,
    selectedCategories,
    priceRange,
    sortBy,
    filterProvinceParam,
    selectedProvinceName,
    selectedWardName,
    selectedLocation,
    distance,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearAllFilters = () => {
    setSelectedTransactionTypes([]);
    setSelectedConditions([]);
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 100000000 });
    setSelectedLocation("");
    setDistance(50);
    setSortBy("newest");
    setSearchQuery("");
    setFilterProvinceParam(null);

    // Navigate to clear URL params
    router.push("/search");
  };

  // Remove individual filters
  const removeTransactionType = (type: string) => {
    setSelectedTransactionTypes(
      selectedTransactionTypes.filter((t) => t !== type)
    );
  };

  const removeCondition = (condition: string) => {
    setSelectedConditions(selectedConditions.filter((c) => c !== condition));
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== categoryId));
  };

  const removePriceFilter = () => {
    setPriceRange({ min: 0, max: 100000000 });
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c._id === categoryId);
    return category?.name || "Danh mục";
  };

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}tr`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}k`;
    }
    return price.toString();
  };

  const activeFilterCount =
    selectedTransactionTypes.length +
    selectedConditions.length +
    selectedCategories.length +
    (selectedLocation || filterProvinceParam ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max < 100000000 ? 1 : 0);

  return (
    <div className={styles.searchPage}>
      {/* Quick Filters Bar - Sticky */}
      <div className={styles.quickFiltersBar}>
        <div className={styles.quickFilters}>
          <button
            className={`${styles.filterChip} ${activeFilterCount > 0 ? styles.active : ""}`}
            onClick={() => setShowMainFilterModal(true)}
          >
            <Icon icon="mdi:filter-variant" width={18} height={18} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>

          <button
            className={`${styles.filterChip} ${selectedCategories.length > 0 ? styles.active : ""}`}
            onClick={() => setShowCategoryModal(true)}
          >
            <Icon icon="mdi:shape" width={18} height={18} />
            Danh mục
            {selectedCategories.length > 0 && (
              <span className={styles.filterBadge}>
                {selectedCategories.length}
              </span>
            )}
          </button>

          <button
            className={`${styles.filterChip} ${selectedConditions.length > 0 ? styles.active : ""}`}
            onClick={() => setShowConditionModal(true)}
          >
            <Icon icon="mdi:check-circle" width={18} height={18} />
            Tình trạng
            {selectedConditions.length > 0 && (
              <span className={styles.filterBadge}>
                {selectedConditions.length}
              </span>
            )}
          </button>

          <button
            className={`${styles.filterChip} ${selectedLocation ? styles.active : ""}`}
            onClick={() => setShowLocationModal(true)}
          >
            <Icon icon="mdi:map-marker" width={18} height={18} />
            Vị trí
          </button>

          <button
            className={`${styles.filterChip} ${priceRange.min > 0 || priceRange.max < 100000000 ? styles.active : ""}`}
            onClick={() => setShowPriceModal(true)}
          >
            <Icon icon="mdi:currency-usd" width={18} height={18} />
            Giá
          </button>

          {/* Sort Dropdown */}
          <div className={styles.sortDropdown}>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Sắp xếp theo"
              aria-label="Sắp xếp theo"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon
              icon="mdi:chevron-down"
              width={18}
              height={18}
              className={styles.sortIcon}
            />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button className={styles.clearAllBtn} onClick={clearAllFilters}>
            <Icon icon="mdi:close-circle" width={18} height={18} />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Active Filters Chips */}
      {activeFilterCount > 0 && (
        <div className={styles.activeFiltersSection}>
          <div className={styles.activeFiltersHeader}>
            <Icon icon="mdi:filter-check" width={18} height={18} />
            <span>Đang lọc theo ({activeFilterCount})</span>
          </div>
          <div className={styles.activeFiltersChips}>
            {/* Search Query Chip */}
            {searchQuery && (
              <div className={styles.activeChip}>
                <Icon icon="mdi:magnify" width={16} height={16} />
                <span className={styles.chipLabel}>
                  Tìm: &ldquo;{searchQuery}&rdquo;
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={() => setSearchQuery("")}
                  title="Xóa"
                  aria-label="Xóa tìm kiếm"
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              </div>
            )}

            {/* Transaction Type Chips */}
            {selectedTransactionTypes.map((type) => (
              <div
                key={type}
                className={`${styles.activeChip} ${styles.chipTransaction}`}
              >
                <Icon icon="mdi:tag" width={16} height={16} />
                <span className={styles.chipLabel}>
                  {TRANSACTION_TYPE_MAP[type] || type}
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={() => removeTransactionType(type)}
                  title="Xóa"
                  aria-label={`Xóa ${TRANSACTION_TYPE_MAP[type]}`}
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              </div>
            ))}

            {/* Condition Chips */}
            {selectedConditions.map((condition) => (
              <div
                key={condition}
                className={`${styles.activeChip} ${styles.chipCondition}`}
              >
                <Icon icon="mdi:check-circle" width={16} height={16} />
                <span className={styles.chipLabel}>
                  {CONDITION_MAP[condition]?.text || condition}
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={() => removeCondition(condition)}
                  title="Xóa"
                  aria-label={`Xóa ${CONDITION_MAP[condition]?.text}`}
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              </div>
            ))}

            {/* Category Chips */}
            {selectedCategories.map((categoryId) => (
              <div
                key={categoryId}
                className={`${styles.activeChip} ${styles.chipCategory}`}
              >
                <Icon icon="mdi:shape" width={16} height={16} />
                <span className={styles.chipLabel}>
                  {getCategoryName(categoryId)}
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={() => removeCategory(categoryId)}
                  title="Xóa"
                  aria-label={`Xóa ${getCategoryName(categoryId)}`}
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              </div>
            ))}

            {/* Price Range Chip */}
            {(priceRange.min > 0 || priceRange.max < 100000000) && (
              <div className={`${styles.activeChip} ${styles.chipPrice}`}>
                <Icon icon="mdi:currency-usd" width={16} height={16} />
                <span className={styles.chipLabel}>
                  {priceRange.min > 0 && priceRange.max < 100000000
                    ? `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`
                    : priceRange.min > 0
                      ? `Từ ${formatPrice(priceRange.min)}`
                      : `Đến ${formatPrice(priceRange.max)}`}
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={removePriceFilter}
                  title="Xóa"
                  aria-label="Xóa bộ lọc giá"
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              </div>
            )}

            {/* Province Chip - SAU SÁP NHẬP 07/2025 */}
            {selectedProvinceName && !selectedWardName && (
              <div className={`${styles.activeChip} ${styles.chipProvince}`}>
                <Icon icon="mdi:city" width={16} height={16} />
                <span className={styles.chipLabel}>
                  {selectedProvinceName}
                  {distance > 0 && ` (${distance}km)`}
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={() => {
                    setSelectedProvinceName("");
                    setSelectedWardName("");
                  }}
                  title="Xóa tỉnh"
                  aria-label="Xóa tỉnh đã chọn"
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              </div>
            )}

            {/* Ward Chip - SAU SÁP NHẬP 07/2025 */}
            {/* Hiển thị cả province và ward trong 1 chip nếu cả 2 đều được chọn */}
            {selectedWardName && (
              <div className={`${styles.activeChip} ${styles.chipWard}`}>
                <Icon icon="mdi:map-marker" width={16} height={16} />
                <span className={styles.chipLabel}>
                  {selectedWardName}
                  {selectedProvinceName && `, ${selectedProvinceName}`}
                  {distance > 0 && ` (${distance}km)`}
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={() => {
                    setSelectedProvinceName("");
                    setSelectedWardName("");
                  }}
                  title="Xóa vị trí"
                  aria-label="Xóa vị trí đã chọn"
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        <span className={styles.resultCount}>
          Tìm thấy <strong>{filteredPosts.length}</strong> kết quả
          {searchQuery && (
            <>
              {" "}
              cho &ldquo;<strong>{searchQuery}</strong>&rdquo;
            </>
          )}
        </span>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Icon
            icon="mdi:loading"
            width={48}
            height={48}
            className={styles.loadingIcon}
          />
          <p>Đang tải...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={styles.emptyState}>
          <Icon
            icon="mdi:inbox"
            width={64}
            height={64}
            className={styles.emptyIcon}
          />
          <h3>Không tìm thấy kết quả</h3>
          <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div ref={listRef}>
          <ListPost posts={filteredPosts} isLoading={isLoading} />
        </div>
      )}

      {/* Modals */}
      <FilterModal
        isOpen={showMainFilterModal}
        onClose={() => setShowMainFilterModal(false)}
        selectedTransactionTypes={selectedTransactionTypes}
        setSelectedTransactionTypes={setSelectedTransactionTypes}
        selectedConditions={selectedConditions}
        setSelectedConditions={setSelectedConditions}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        distance={distance}
        setDistance={setDistance}
        onApply={() => setShowMainFilterModal(false)}
        onReset={clearAllFilters}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
      />

      <ConditionModal
        isOpen={showConditionModal}
        onClose={() => setShowConditionModal(false)}
        selectedConditions={selectedConditions}
        setSelectedConditions={setSelectedConditions}
      />

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        distance={distance}
        setDistance={setDistance}
        setSelectedProvinceName={setSelectedProvinceName}
        setSelectedWardName={setSelectedWardName}
        initialProvinceCode={
          searchParams.get("provinceCode")
            ? Number(searchParams.get("provinceCode"))
            : undefined
        }
      />

      <PriceRangeModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
