/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import styles from "./postList.module.scss";
// Iconify import (replace HeartSVG with this icon)
import { Icon } from "@iconify/react";

// Local SVG icons (matching files in public/image/feed)
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

type Author = {
  name: string;
  reputationScore: number;
  reviewCount: number;
  isVerified: boolean;
};

type ItemData = {
  id: number;
  isAvailable: boolean;
  postType: "BÁN" | "TRAO ĐỔI" | "TẶNG" | string;
  title: string;
  description: string;
  price: string;
  currency: string;
  conditionKey: string;
  category: string;
  imageUrl: string;
  imageCount: number;
  author: Author;
  timePosted: string;
  location: string;
  proximity: string;
  views: number;
  favorites: number;
};

const CONDITION_MAP: Record<string, { text: string; colorKey: string }> = {
  new: { text: "Mới 100%", colorKey: "new" },
  like_new: { text: "Gần như mới", colorKey: "like_new" },
  used: { text: "Đã sử dụng", colorKey: "used" },
  minor_flaw: { text: "Hư nhẹ", colorKey: "minor_flaw" },
  for_repair: { text: "Cần sửa chữa", colorKey: "for_repair" },
  for_parts: { text: "Đã hư", colorKey: "for_parts" },
};

const itemsData: ItemData[] = [
  {
    id: 1,
    isAvailable: true,
    postType: "BÁN",
    title: "Máy ép chậm Hurom H-AA (Mới Nguyên Hộp - Chưa khui)",
    description:
      "Máy ép chậm model mới nhất, chưa từng khui seal. Cần tiền nên bán lại giá tốt. Có thể check số series với hãng. Phù hợp cho gia đình có nhu cầu sử dụng ngay.",
    price: "5.200.000",
    currency: "VND",
    conditionKey: "new",
    category: "Thiết bị nhà bếp",
    imageUrl: "https://placehold.co/600x450/10b981/ffffff?text=Hurom+Mới+100%",
    imageCount: 3,
    author: {
      name: "Nguyễn Văn Z",
      reputationScore: 4.9,
      reviewCount: 99,
      isVerified: true,
    },
    timePosted: "10 phút trước",
    location: "Quận 4, TP.HCM",
    proximity: "2.5 km",
    views: 50,
    favorites: 10,
  },
  {
    id: 2,
    isAvailable: true,
    postType: "BÁN",
    title: "MacBook Pro M1 2020 - 16GB/512GB (Fullbox, Còn Bảo Hành Apple)",
    description:
      "Máy còn nguyên hộp, sạc zin, pin cycle count cực thấp. Ngoại hình đẹp như mới, không trầy xước.",
    price: "18.500.000",
    currency: "VND",
    conditionKey: "like_new",
    category: "Laptop & Máy tính",
    imageUrl:
      "https://placehold.co/600x450/3b82f6/ffffff?text=MacBook+Pro+99%25",
    imageCount: 4,
    author: {
      name: "Nguyễn Văn A",
      reputationScore: 4.8,
      reviewCount: 125,
      isVerified: true,
    },
    timePosted: "1 giờ trước",
    location: "Quận 1, TP.HCM",
    proximity: "3.2 km",
    views: 345,
    favorites: 56,
  },
  {
    id: 3,
    isAvailable: true,
    postType: "TRAO ĐỔI",
    title:
      "Xe đạp Fixed Gear Trắng Đen (Đã qua sử dụng 1 năm, cần đổi Xe đạp địa hình)",
    description:
      "Xe Fixed Gear size 50, đã thay yên và tay lái phụ. Có vài vết xước nhỏ ở khung xe do sử dụng. Bảo dưỡng định kỳ. Muốn đổi sang xe đạp địa hình.",
    price: "Đổi MTB",
    currency: "Trao đổi",
    conditionKey: "used",
    category: "Thể thao & Dã ngoại",
    imageUrl: "https://placehold.co/600x450/06b6d4/ffffff?text=Fixed+Gear+Used",
    imageCount: 5,
    author: {
      name: "Phan Thị B",
      reputationScore: 5.0,
      reviewCount: 200,
      isVerified: true,
    },
    timePosted: "30 phút trước",
    location: "Quận 7, TP.HCM",
    proximity: "1.5 km",
    views: 120,
    favorites: 90,
  },
  {
    id: 4,
    isAvailable: true,
    postType: "BÁN",
    title: "Loa Bluetooth JBL Flip 6 (Hư nhẹ màng loa, vẫn nghe được)",
    description:
      "Loa bị thủng một lỗ nhỏ trên màng loa do va chạm, nhưng chất lượng âm thanh vẫn ổn định, không rè. Pin còn dùng tốt 5-6 tiếng. Bán giá rẻ cho bạn nào không quá khắt khe về ngoại hình.",
    price: "1.200.000",
    currency: "VND",
    conditionKey: "minor_flaw",
    category: "Âm thanh",
    imageUrl: "https://placehold.co/600x450/ef4444/ffffff?text=Loa+Hư+Nhẹ",
    imageCount: 2,
    author: {
      name: "Trần Văn C",
      reputationScore: 4.2,
      reviewCount: 50,
      isVerified: false,
    },
    timePosted: "2 ngày trước",
    location: "Thủ Đức, TP.HCM",
    proximity: "7.8 km",
    views: 600,
    favorites: 10,
  },
  {
    id: 5,
    isAvailable: true,
    postType: "TẶNG",
    title: "Máy pha cà phê Delonghi (Lỗi bơm áp suất, cần sửa)",
    description:
      "Máy Delonghi 3 năm tuổi, gần đây bị lỗi không bơm được áp suất nước. Máy vẫn lên nguồn. Tặng lại cho bạn nào có kinh nghiệm sửa chữa máy pha cà phê.",
    price: "#FREE",
    currency: "Tặng",
    conditionKey: "for_repair",
    category: "Thiết bị nhà bếp",
    imageUrl: "https://placehold.co/600x450/f97316/ffffff?text=Máy+Cần+Sửa",
    imageCount: 2,
    author: {
      name: "Lê Thị D",
      reputationScore: 4.9,
      reviewCount: 300,
      isVerified: true,
    },
    timePosted: "3 ngày trước",
    location: "Quận 3, TP.HCM",
    proximity: "0.5 km",
    views: 1200,
    favorites: 150,
  },
  {
    id: 6,
    isAvailable: true,
    postType: "BÁN",
    title: "Laptop HP Elitebook (Đã hỏng Mainboard - Bán linh kiện rời)",
    description:
      "Máy đã hỏng mainboard do chập điện, không thể sửa. Còn lại màn hình, bàn phím, ổ cứng, RAM đều hoạt động tốt. Bán toàn bộ hoặc bán lẻ từng bộ phận. Giá trên là giá cho toàn bộ linh kiện.",
    price: "800.000",
    currency: "VND",
    conditionKey: "for_parts",
    category: "Linh kiện máy tính",
    imageUrl: "https://placehold.co/600x450/78716c/ffffff?text=Bán+Linh+Kiện",
    imageCount: 3,
    author: {
      name: "Phạm Văn E",
      reputationScore: 4.5,
      reviewCount: 70,
      isVerified: false,
    },
    timePosted: "1 tuần trước",
    location: "Bình Thạnh, TP.HCM",
    proximity: "4.0 km",
    views: 900,
    favorites: 40,
  },
];

export const ListPost: React.FC = () => {
  const [items, setItems] =
    React.useState<(ItemData & { isFavorited?: boolean })[]>(itemsData);

  // Note: rely on CSS `.line-clamp-*` classes for truncation/overflow handling

  const handleRippleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      // Create a ripple element that uses the module-scoped class so styles apply
      const ripple = document.createElement("span");
      // Assign the hashed class name from CSS modules
      ripple.className = styles["ripple-span"] || "ripple-span";

      // Position the ripple without affecting layout (absolute positioning handled in CSS)
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";

      // Remove any existing ripples inside this button (matching module-scoped class)
      btn
        .querySelectorAll(`.${styles["ripple-span"]}`)
        .forEach((s: Element) => (s as HTMLElement).remove());

      btn.appendChild(ripple);
      // Ensure ripple is removed after animation ends
      setTimeout(() => ripple.remove(), 600);
    },
    []
  );

  React.useEffect(() => {
    // Query using the module-scoped class name so hashed class is matched at runtime
    const selector = `.${styles["quick-action-btn"]}`;
    const buttons = Array.from(
      document.querySelectorAll(selector)
    ) as HTMLButtonElement[];
    buttons.forEach((b) => (b.onclick = handleRippleClick as any));
    return () => buttons.forEach((b) => (b.onclick = null));
  }, [handleRippleClick]);

  const toggleFavorite = React.useCallback((itemId: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              isFavorited: !it.isFavorited,
              favorites: it.isFavorited
                ? Math.max(0, it.favorites - 1)
                : it.favorites + 1,
            }
      )
    );
  }, []);

  const badgeClassFor = React.useCallback((postType: string) => {
    switch (postType) {
      case "BÁN":
        return styles["post-badge-ban"];
      case "TRAO ĐỔI":
        return styles["post-badge-trao"];
      case "TẶNG":
        return styles["post-badge-tang"];
    }
  }, []);

  return (
    <div className={styles["card-carousel"]} id="cardCarousel">
      {items.map((data) => {
        const conditionInfo = CONDITION_MAP[data.conditionKey] || {
          text: "Không rõ",
          colorKey: "for_parts",
        };
        return (
          <div
            key={data.id}
            id={`itemCard-${data.id}`}
            className={`${styles["item-card"]} ${styles.card}`}
          >
            <div className={styles["image-wrapper"]}>
              <img
                className={styles["item-image"]}
                src={data.imageUrl}
                alt={data.title}
              />

              <div
                className={`${styles["post-type-badge"]} ${badgeClassFor(data.postType)}`}
              >
                {data.postType}
              </div>

              <div className={styles["quick-actions--absolute"]}>
                <button
                  title="Yêu thích"
                  className={`${styles["quick-action-btn"]} ${styles["ripple-target"]} ${styles["quick-action-btn--red"]}`}
                  onClick={(e) => {
                    handleRippleClick(e);
                    toggleFavorite(data.id);
                  }}
                >
                  <span
                    className={`${styles.heartIcon} ${data.isFavorited ? styles.heartIconActive : ""}`}
                  >
                    <Icon
                      icon={
                        data.isFavorited
                          ? "ic:sharp-favorite"
                          : "ic:twotone-favorite"
                      }
                      width={30}
                      height={30}
                    />
                  </span>
                </button>
                {/* <button
                  title="Chia sẻ"
                  className={`${styles["quick-action-btn"]} ${styles["ripple-target"]} ${styles["quick-action-btn--indigo"]}`}
                  onClick={handleRippleClick}
                >
                  <img src={ICONS.share} alt="Chia sẻ" width={25} height={25} />
                </button> */}
              </div>
              <div className={styles["time-badge"]}>{data.timePosted}</div>

              <div className={styles["image-count-badge"]}>
                <img src={ICONS.image} alt="Ảnh" width={14} height={14} />{" "}
                {data.imageCount} Ảnh
              </div>

              {!data.isAvailable && (
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
              <div className={styles.price}>
                {data.price === "#FREE" ? (
                  <h2 className={styles["price-gradient"]}>#FREE</h2>
                ) : (
                  <h2 className={styles["price-gradient"]}>
                    {data.price} <small>{data.currency}</small>
                  </h2>
                )}
              </div>

              <h3
                className={`${styles["title"]} ${styles["line-clamp-2"]}`}
                title={
                  data.title && data.title.length > 80 ? data.title : undefined
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
                  {data.category}
                </span>
              </div>
            </div>

            <div className={styles["author-row"]}>
              <div className={styles["author-info"]}>
                <img
                  className={styles.avatar}
                  src={`https://placehold.co/40x40/facc15/333333?text=${data.author.name.charAt(0)}`}
                  alt="Avatar Người đăng"
                />
                <div>
                  <div className={styles["author-name"]}>
                    {data.author.name}
                    {data.author.isVerified && (
                      <img
                        src={ICONS.badge}
                        alt="Đã xác thực"
                        width={16}
                        height={16}
                        className={styles["verified-badge"]}
                      />
                    )}
                  </div>
                  <div className={styles.reputation}>
                    {/* Render stars using Iconify SVG icons for reliable SVG clipping */}
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
                        const rawScore = Math.max(
                          1,
                          data.author.reputationScore
                        );
                        // exact percent (1% granularity) so .5 and .2 are visible
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
                                  el.classList.remove(styles.starsOverlayFull);
                                }
                              } catch {
                                /* ignore in SSR or non-DOM contexts */
                              }
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
                    <strong>{data.author.reputationScore}/5</strong>{" "}
                    <span className={styles.reviews}>
                      ({data.author.reviewCount} đánh giá)
                    </span>
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
                    {data.location}
                  </span>
                  <span className={styles.proximity}>({data.proximity})</span>
                </div>
              </div>

              <div className={styles["small-stats"]}>
                <span className={styles["text-xs"]}>
                  <img src={ICONS.eye} alt="Lượt xem" width={15} height={15} />
                  {data.views}
                </span>
                <span className={`${styles["text-xs"]} ${styles["stat-fav"]}`}>
                  <img
                    src={ICONS.heart_viewer}
                    alt="Yêu thích"
                    width={15}
                    height={15}
                  />
                  {data.favorites}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListPost;
