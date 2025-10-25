/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./postList.module.scss";
// Iconify import (replace HeartSVG with this icon)
import { Icon } from "@iconify/react";
import { apiClient } from "@/lib/api-client";

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

const CONDITION_MAP: Record<string, { text: string; colorKey: string }> = {
  new: { text: "Mới 100%", colorKey: "new" },
  like_new: { text: "Gần như mới", colorKey: "like_new" },
  used: { text: "Đã sử dụng", colorKey: "used" },
  minor_flaw: { text: "Hư nhẹ", colorKey: "minor_flaw" },
  for_repair: { text: "Cần sửa chữa", colorKey: "for_repair" },
  for_parts: { text: "Đã hư", colorKey: "for_parts" },
};

interface Post {
  post_id?: string;
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
}

interface ListPostProps {
  posts?: Post[]; // Optional: nếu không truyền thì sẽ fetch từ API
  isLoading?: boolean;
}

export const ListPost: React.FC<ListPostProps> = ({ posts }) => {
  const router = useRouter();
  //Lấy user hiện tại
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  //Lấy dữ liệu từ database
  const [postsData, setPostsData] = useState<Post[]>([]);
  const [favoriteData, setFavoriteData] = useState<Post[]>([]);

  // Sử dụng posts từ props nếu có, không thì fetch từ API
  useEffect(() => {
    if (posts && posts.length > 0) {
      setPostsData(posts);
    } else {
      async function fetchPosts() {
        try {
          const res = await apiClient.get("/posts/active");
          if (res.data && Array.isArray(res.data)) {
            setPostsData(res.data);
          } else {
            console.error("Invalid response format from posts API");
            setPostsData([]);
          }
        } catch (error) {
          console.error("Error fetching posts:", error);
          setPostsData([]);
        }
      }
      fetchPosts();
    }
  }, [posts]);

  useEffect(() => {
    if (!currentUser?._id) return; // 🚫 nếu chưa có user thì không gọi

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

  //dữ liệu tạm thời

  const checkFavorited = React.useCallback(
    (postId: string) => {
      return favoriteData.some((fav) => fav.post_id === postId);
    },
    [favoriteData]
  );

  ////Tính thời gian
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

  const toggleFavorite = React.useCallback(
    async (postId: string) => {
      if (!currentUser?._id) {
        // Xử lý trường hợp người dùng chưa đăng nhập (ví dụ: chuyển hướng đến trang đăng nhập)
        alert("Vui lòng đăng nhập để thực hiện chức năng này.");
        return;
      }

      const isCurrentlyFavorited = checkFavorited(postId);

      try {
        if (isCurrentlyFavorited) {
          // XÓA khỏi favorites (DELETE request)
          await apiClient.delete(`/favorites/post/${postId}`, {
            data: { user_id: currentUser._id },
          });
          setFavoriteData((prev) =>
            prev.filter((fav) => fav.post_id !== postId)
          );
          console.log(`Đã xóa bài đăng ${postId} khỏi favorites.`);
        } else {
          // THÊM vào favorites (POST request)
          await apiClient.post(`/favorites/`, {
            user_id: currentUser._id,
            post_id: postId,
          });

          const postToAdd = postsData.find((p) => p._id === postId);
          if (postToAdd) {
            setFavoriteData((prev) => [
              ...prev,
              { ...postToAdd, post_id: postId } as Post,
            ]);
          }
          console.log(`Đã thêm bài đăng ${postId} vào favorites.`);
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái yêu thích:", error);
        alert("Đã xảy ra lỗi khi cập nhật yêu thích.");
      }
    },
    [currentUser, checkFavorited, postsData]
  ); // Thêm dependencies

  const badgeClassFor = React.useCallback((postType: string) => {
    switch (postType) {
      case "sell":
        return styles["post-badge-ban"];
      case "exchange":
        return styles["post-badge-trao"];
      case "give away":
        return styles["post-badge-tang"];
    }
  }, []);

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

  return (
    <div className={styles["card-carousel"]} id="cardCarousel">
      {postsData.map((data) => {
        const conditionInfo = CONDITION_MAP[data.condition] || {
          text: "Không rõ",
          colorKey: "for_parts",
        };
        return (
          <div
            key={data._id}
            id={`itemCard-${data._id}`}
            className={`${styles["item-card"]} ${styles.card}`}
            onClick={() => {
              if (!currentUser) {
                alert("Vui lòng đăng nhập để xem chi tiết bài đăng.");
                return; // Dừng luôn, không chuyển trang
              }
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
                  {/* chưa có Yêu thích*/}
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

                {/* <button
                  title="Chia sẻ"
                  className={`${styles["quick-action-btn"]} ${styles["ripple-target"]} ${styles["quick-action-btn--indigo"]}`}
                  onClick={handleRippleClick}
                >
                  <img src={ICONS.share} alt="Chia sẻ" width={25} height={25} />
                </button> */}
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
                      ? process.env.NEXT_PUBLIC_URL_GCS + data.author_id.avatar
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
                        const rawScore = Math.max(
                          1,
                          5 // data.author.reputationScore
                        );

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
                  <img src={ICONS.eye} alt="Lượt xem" width={15} height={15} />
                  {/* {data.views} */}0
                </span>
                <span className={`${styles["text-xs"]} ${styles["stat-fav"]}`}>
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
  );
};

export default ListPost;
