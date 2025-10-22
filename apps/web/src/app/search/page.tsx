/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./search.module.scss";
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";
import FilterModal from "./components/FilterModal";
import CategoryModal from "./components/CategoryModal";
import ConditionModal from "./components/ConditionModal";
import LocationModal from "./components/LocationModal";
import PriceRangeModal from "./components/PriceRangeModal";

// Local SVG icons
const ICONS = {
  heart: "/image/feed/favorite-active.svg",
  heart_alt: "/image/feed/favorite-none-active.svg",
  heart_viewer: "/image/feed/favorite-viewer.svg",
  share: "/image/feed/share.svg",
  image: "/image/feed/picture.svg",
  badge: "/image/feed/verified.svg",
  mappin: "/image/feed/location.svg",
  eye: "/image/feed/viewer.svg",
  tag: "/image/feed/tag.svg",
  star: "/image/feed/star.svg",
};

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
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [postsData, setPostsData] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [favoriteData, setFavoriteData] = useState<any[]>([]);

  // Load currentUser from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  // Filter states - lấy từ URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
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
  const [distance, setDistance] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Modal states
  const [showMainFilterModal, setShowMainFilterModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Sync search query từ URL
  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);
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

  // Fetch favorites
  useEffect(() => {
    if (!currentUser?._id) return;

    async function fetchFavorites() {
      try {
        const res = await apiClient.get(`/favorites/user/${currentUser._id}`);
        setFavoriteData(res.data);
      } catch (err) {
        console.error("Error loading favorites:", err);
      }
    }

    fetchFavorites();
  }, [currentUser]);

  const applyFilters = React.useCallback(() => {
    let filtered = [...postsData];

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

    // Categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((post) =>
        post.category_id?._id
          ? selectedCategories.includes(post.category_id._id)
          : false
      );
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
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const badgeClassFor = (postType: string) => {
    switch (postType) {
      case "sell":
        return styles["post-badge-ban"];
      case "exchange":
        return styles["post-badge-trao"];
      case "give away":
        return styles["post-badge-tang"];
      default:
        return "";
    }
  };

  const setTransactionType = (type: string) => {
    switch (type) {
      case "sell":
        return "BÁN";
      case "give away":
        return "TẶNG";
      case "exchange":
        return "TRAO ĐỔI";
      default:
        return type;
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(n);

  const clearAllFilters = () => {
    setSelectedTransactionTypes([]);
    setSelectedConditions([]);
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 100000000 });
    setSelectedLocation("");
    setDistance(50);
    setSortBy("newest");
    setSearchQuery("");
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

  const removeLocationFilter = () => {
    setSelectedLocation("");
    setDistance(50);
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

  // Helper functions from ListPost
  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    const years = Math.floor(months / 12);
    return `${years} năm trước`;
  };

  const handleRippleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.className = styles["ripple-span"] || "ripple-span";

      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";

      btn
        .querySelectorAll(`.${styles["ripple-span"]}`)
        .forEach((s: Element) => (s as HTMLElement).remove());

      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    },
    []
  );

  React.useEffect(() => {
    const selector = `.${styles["quick-action-btn"]}`;
    const buttons = Array.from(
      document.querySelectorAll(selector)
    ) as HTMLButtonElement[];
    buttons.forEach((b) => (b.onclick = handleRippleClick as any));
    return () => buttons.forEach((b) => (b.onclick = null));
  }, [handleRippleClick]);

  const checkFavorited = React.useCallback(
    (postId: string) => {
      return favoriteData.some((fav) => fav.post_id === postId);
    },
    [favoriteData]
  );

  const toggleFavorite = React.useCallback(
    async (postId: string) => {
      if (!currentUser?._id) {
        alert("Vui lòng đăng nhập để thực hiện chức năng này.");
        return;
      }

      const isCurrentlyFavorited = checkFavorited(postId);

      try {
        if (isCurrentlyFavorited) {
          await apiClient.delete(`/favorites/post/${postId}`, {
            data: { user_id: currentUser._id },
          });
          setFavoriteData((prev) =>
            prev.filter((fav) => fav.post_id !== postId)
          );
          console.log(`Đã xóa bài đăng ${postId} khỏi favorites.`);
        } else {
          await apiClient.post(`/favorites/`, {
            user_id: currentUser._id,
            post_id: postId,
          });

          const postToAdd = postsData.find((p) => p._id === postId);
          if (postToAdd) {
            setFavoriteData((prev) => [
              ...prev,
              { ...postToAdd, post_id: postId } as any,
            ]);
          }
          console.log(`Đã thêm bài đăng ${postId} vào favorites.`);
        }
      } catch (err) {
        console.error("Lỗi toggle favorite:", err);
        alert("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    },
    [currentUser, checkFavorited, postsData]
  );

  const activeFilterCount =
    selectedTransactionTypes.length +
    selectedConditions.length +
    selectedCategories.length +
    (selectedLocation ? 1 : 0) +
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

            {/* Location Chip */}
            {selectedLocation && (
              <div className={`${styles.activeChip} ${styles.chipLocation}`}>
                <Icon icon="mdi:map-marker" width={16} height={16} />
                <span className={styles.chipLabel}>
                  {selectedLocation} ({distance}km)
                </span>
                <button
                  className={styles.chipRemove}
                  onClick={removeLocationFilter}
                  title="Xóa"
                  aria-label="Xóa bộ lọc vị trí"
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
        <div className={styles.cardCarousel}>
          {filteredPosts.map((data) => {
            const conditionInfo = CONDITION_MAP[data.condition] || {
              text: "Không rõ",
              colorKey: "for_parts",
            };
            return (
              <div
                key={data._id}
                className={`${styles["item-card"]} ${styles.card}`}
                onClick={() => {
                  try {
                    sessionStorage.setItem(
                      `selectedPost_${data._id}`,
                      JSON.stringify(data)
                    );
                  } catch {}
                  router.push(
                    `/post/detailPost?postId=${encodeURIComponent(data._id)}`
                  );
                }}
              >
                <div className={styles["image-wrapper"]}>
                  <img
                    className={styles["item-image"]}
                    src={
                      data.images && data.images.length > 0
                        ? process.env.NEXT_PUBLIC_URL_GCS + data.images[0].url
                        : "https://placehold.co/600x450/9ca3af/ffffff?text=No+Image"
                    }
                    alt={data.title}
                  />

                  <div
                    className={`${styles["post-type-badge"]} ${badgeClassFor(data.transaction_type)}`}
                  >
                    {setTransactionType(data.transaction_type)}
                  </div>

                  <div className={styles["quick-actions--absolute"]}>
                    <button
                      title="Yêu thích"
                      className={`${styles["quick-action-btn"]} ${styles["ripple-target"]} ${styles["quick-action-btn--red"]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRippleClick(e);
                        toggleFavorite(data._id);
                        checkFavorited(data._id);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`${styles.heartIcon} ${checkFavorited(data._id) ? styles.heartIconActive : ""}`}
                      >
                        <Icon
                          icon={
                            checkFavorited(data._id)
                              ? "ic:sharp-favorite"
                              : "ic:twotone-favorite"
                          }
                          width={30}
                          height={30}
                        />
                      </span>
                    </button>
                  </div>

                  <div className={styles["time-badge"]}>
                    {getRelativeTime(data.updatedAt)}
                  </div>

                  <div className={styles["image-count-badge"]}>
                    <img src={ICONS.image} alt="Ảnh" width={14} height={14} />{" "}
                    {data.images.length} Ảnh
                  </div>

                  {data.status === "completed" && (
                    <div className={styles["unavailable-overlay"]}>
                      <span className={styles["unavailable-label"]}>
                        ĐÃ THANH LÝ
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={`${styles["card-body"]} ${styles["card-body--md"]}`}
                >
                  <div id="post-price" className={`${styles["price"]}`}>
                    {data.transaction_type === "give away"
                      ? "Miễn phí"
                      : data.transaction_type === "exchange"
                        ? "Trao đổi"
                        : formatCurrency(data.price)}
                  </div>

                  <h3
                    className={`${styles["title"]} ${styles["line-clamp-2"]}`}
                    title={
                      data.title && data.title.length > 80
                        ? data.title
                        : undefined
                    }
                  >
                    {data.title}
                  </h3>

                  <p
                    className={`${styles["description"]} ${styles["line-clamp-4"]}`}
                    title={
                      data.description && data.description.length > 160
                        ? data.description
                        : undefined
                    }
                  >
                    {data.description}
                  </p>

                  <div className={styles["meta-row"]}>
                    <span
                      className={`${styles["condition-tag"]} ${styles[`condition-${conditionInfo.colorKey}`]}`}
                    >
                      {conditionInfo.text}
                    </span>
                    <span className={styles.tag}>
                      <img src={ICONS.tag} alt="Tag" width={16} height={16} />{" "}
                      {data.category_id?.name}
                    </span>
                  </div>
                </div>

                <div className={styles["author-row"]}>
                  <div className={styles["author-info"]}>
                    <img
                      className={styles.avatar}
                      src={
                        data.author_id?.avatar
                          ? process.env.NEXT_PUBLIC_URL_GCS +
                            data.author_id.avatar
                          : "/image/header/carbon_user-avatar-filled-alt.svg"
                      }
                      alt="Avatar Người đăng"
                    />
                    <div>
                      <div className={styles["author-name"]}>
                        {data.author_id.full_name}
                        {/* {data.author.isVerified && ( */}
                        <img
                          src={ICONS.badge}
                          alt="Đã xác thực"
                          width={16}
                          height={16}
                          className={styles["verified-badge"]}
                        />
                        {/* )} */}
                      </div>
                      <div className={styles.reputation}>
                        <span
                          className={`${styles.starContainer} ${styles.stars} ${styles.starsFlex}`}
                          aria-hidden
                        >
                          <span className={styles.iconStarBase}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Icon
                                key={`b-${i}`}
                                icon="material-symbols:star"
                                width={18}
                                height={18}
                              />
                            ))}
                          </span>

                          {(() => {
                            const rawScore = Math.max(1, 5);
                            const pct = Math.round((rawScore / 5) * 100);
                            return (
                              <span
                                className={`${styles.starsOverlay}`}
                                aria-hidden
                                ref={(el) => {
                                  if (!el) return;
                                  try {
                                    (el as HTMLElement).style.width = `${pct}%`;
                                    if (pct === 100) {
                                      el.classList.add(styles.starsOverlayFull);
                                    } else {
                                      el.classList.remove(
                                        styles.starsOverlayFull
                                      );
                                    }
                                  } catch {}
                                }}
                              >
                                <span className={styles.iconStarColored}>
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Icon
                                      key={`c-${i}`}
                                      icon="material-symbols:star"
                                      width={18}
                                      height={18}
                                    />
                                  ))}
                                </span>
                              </span>
                            );
                          })()}
                        </span>
                        <strong>5/5</strong>{" "}
                        <span className={styles.reviews}>( đánh giá)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles["stats-row"]}>
                  <div className={styles.location}>
                    <img
                      src={ICONS.mappin}
                      alt="Vị trí"
                      width={18}
                      height={18}
                      className={styles["map-pin"]}
                    />
                    <div className={styles["location-text"]}>
                      <span className={styles["location-name"]}>
                        {data.location.address}
                      </span>
                      <span className={styles.proximity}>.</span>
                    </div>
                  </div>

                  <div className={styles["small-stats"]}>
                    <span className={styles["text-xs"]}>
                      <img
                        src={ICONS.eye}
                        alt="Lượt xem"
                        width={15}
                        height={15}
                      />
                      {/* {data.views} */}0
                    </span>
                    <span
                      className={`${styles["text-xs"]} ${styles["stat-fav"]}`}
                    >
                      <img
                        src={ICONS.heart_viewer}
                        alt="Yêu thích"
                        width={15}
                        height={15}
                      />
                      {/* {data.favorites} */}0
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
