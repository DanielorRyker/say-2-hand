// ==========================================
// MOBILE SEARCH VIEW - Giao diện riêng cho mobile
// ==========================================
// Component này sẽ được dùng thay thế cho desktop view khi ở mobile

"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";
import styles from "../search-mobile.module.scss";

interface Post {
  _id: string;
  title: string;
  description: string;
  images: { _id: string; url: string; alt?: string; tags: string[] }[];
  condition: string;
  transaction_type: string;
  price: number;
  location: { address: string; geo?: { type: string; coordinates: [number, number] } };
  author_id: { _id: string; full_name: string; avatar: string };
  category_id?: { _id?: string; name?: string } | null;
  createdAt: string;
  stats?: { view_count: number; favorite_count: number };
}

interface MobileSearchViewProps {
  posts: Post[];
  isLoading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onFilterClick: () => void;
  activeFiltersCount: number;
  onPostClick: (postId: string) => void;
}

const CONDITION_MAP: Record<string, { text: string; color: string }> = {
  new: { text: "Mới 100%", color: "#10b981" },
  like_new: { text: "Gần như mới", color: "#06b6d4" },
  used: { text: "Đã sử dụng", color: "#3b82f6" },
  minor_flaw: { text: "Hư nhẹ", color: "#f97316" },
  for_repair: { text: "Cần sửa chữa", color: "#8b5cf6" },
  for_parts: { text: "Đã hư", color: "#ef4444" },
};

const TRANSACTION_TYPE_MAP: Record<string, string> = {
  sell: "Bán",
  exchange: "Trao đổi",
  give_away: "Tặng",
  "give away": "Tặng",
};

export default function MobileSearchView({
  posts,
  isLoading,
  sortBy,
  onSortChange,
  onFilterClick,
  activeFiltersCount,
  onPostClick,
}: MobileSearchViewProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  return (
    <div className={styles.mobileSearchView}>
      {/* Sticky Top Bar - Sort & Filter */}
      <div className={styles.mobileTopBar}>
        <div className={styles.sortSection}>
          <Icon icon="mdi:sort" width={20} height={20} />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className={styles.sortSelect}
            title="Sắp xếp theo"
            aria-label="Sắp xếp sản phẩm"
          >
            <option value="newest">Mới nhất</option>
            <option value="nearest">Gần nhất</option>
            <option value="price_asc">Giá thấp → cao</option>
            <option value="price_desc">Giá cao → thấp</option>
          </select>
        </div>

        <button className={styles.filterButton} onClick={onFilterClick}>
          <Icon icon="mdi:filter-variant" width={20} height={20} />
          <span>Lọc</span>
          {activeFiltersCount > 0 && (
            <span className={styles.filterBadge}>{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Results Count */}
      <div className={styles.resultsCount}>
        <Icon icon="mdi:file-document-outline" width={18} height={18} />
        <span>
          {isLoading ? "Đang tải..." : `${posts.length} sản phẩm`}
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loadingContainer}>
          <Icon icon="mdi:loading" className={styles.spinner} width={40} height={40} />
          <p>Đang tìm kiếm...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <div className={styles.emptyState}>
          <Icon icon="mdi:package-variant-closed" width={64} height={64} />
          <h3>Không tìm thấy sản phẩm</h3>
          <p>Thử điều chỉnh bộ lọc hoặc tìm kiếm khác</p>
        </div>
      )}

      {/* Mobile Card Grid */}
      {!isLoading && posts.length > 0 && (
        <div className={styles.mobileCardGrid}>
          {posts.map((post) => (
            <div
              key={post._id}
              className={styles.mobileCard}
              onClick={() => onPostClick(post._id)}
            >
              {/* Card Image */}
              <div className={styles.cardImage}>
                {post.images && post.images.length > 0 ? (
                  <Image
                    src={post.images[0].url}
                    alt={post.title}
                    fill
                    sizes="(max-width: 480px) 50vw, (max-width: 640px) 33vw, 25vw"
                    style={{ objectFit: "cover" }}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.noImage}>
                    <Icon icon="mdi:image-off-outline" width={40} height={40} />
                  </div>
                )}
                
                {/* Transaction Type Badge */}
                <div className={`${styles.transactionBadge} ${styles[post.transaction_type]}`}>
                  {TRANSACTION_TYPE_MAP[post.transaction_type] || post.transaction_type}
                </div>

                {/* Condition Badge */}
                <div
                  className={styles.conditionBadge}
                  data-condition={post.condition}
                >
                  {CONDITION_MAP[post.condition]?.text || post.condition}
                </div>
              </div>

              {/* Card Content */}
              <div className={styles.cardContent}>
                {/* Title */}
                <h3 className={styles.cardTitle}>{post.title}</h3>

                {/* Price */}
                {post.transaction_type === "sell" && (
                  <div className={styles.cardPrice}>
                    {formatPrice(post.price)}
                  </div>
                )}
                {post.transaction_type === "exchange" && (
                  <div className={styles.cardExchange}>Trao đổi</div>
                )}
                {post.transaction_type === "give_away" && (
                  <div className={styles.cardGiveaway}>Miễn phí</div>
                )}

                {/* Location & Time */}
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <Icon icon="mdi:map-marker" width={14} height={14} />
                    <span>{post.location.address.split(",").slice(-2).join(",").trim()}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Icon icon="mdi:clock-outline" width={14} height={14} />
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className={styles.cardStats}>
                  <div className={styles.statItem}>
                    <Icon icon="mdi:eye-outline" width={16} height={16} />
                    <span>{post.stats?.view_count || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <Icon icon="mdi:heart-outline" width={16} height={16} />
                    <span>{post.stats?.favorite_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
