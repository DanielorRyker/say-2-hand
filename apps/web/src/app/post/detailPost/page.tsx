"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";

import styles from "./DetailPost.module.scss";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatImageUrl, URL_GCS } from "@/lib/constants";
// Import các component nhỏ đã tách
import Gallery from "./component/Gallery";
import InfoCard from "./component/InfoCard";
import DescriptionCard from "./component/DescriptionCard";
import SellerCard from "./component/SellerCard";
import CTAArea from "./component/CTAArea";
import LocationBox from "./component/LocationBox";
import Lightbox from "./component/Lightbox";
import MobileFooter from "./component/MobileFooter";
import Breadcrumb from "./component/Breadcrumb";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n
  );

// Helper tạo hiệu ứng ripple cho button

export function createRipple(
  e: React.MouseEvent | MouseEvent,
  btn?: HTMLElement
) {
  try {
    const ev = e as MouseEvent;
    let targetBtn: HTMLElement | null = null;
    if (btn) targetBtn = btn;
    else if ((e as React.MouseEvent).currentTarget)
      targetBtn = (e as React.MouseEvent).currentTarget as HTMLElement;
    else if ((e as any).target)
      targetBtn = ((e as any).target as HTMLElement).closest
        ? ((e as any).target as HTMLElement).closest("button")
        : null;
    if (!targetBtn) return;
    const existing = targetBtn.querySelector(`.${styles["ripple-span"]}`);
    if (existing) existing.remove();
    const rect = targetBtn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = styles["ripple-span"] || "ripple-span";
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    const clientX =
      ev && typeof ev.clientX === "number"
        ? ev.clientX
        : rect.left + rect.width / 2;
    const clientY =
      ev && typeof ev.clientY === "number"
        ? ev.clientY
        : rect.top + rect.height / 2;
    ripple.style.left = `${clientX - rect.left - size / 2}px`;
    ripple.style.top = `${clientY - rect.top - size / 2}px`;
    targetBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  } catch {
    // swallow errors—non-critical UI effect
  }
}

const DetailPostPage: React.FC = () => {
  const router = useRouter();
  // Khởi tạo postData là object rỗng hoặc null để tránh lỗi ReferenceError
  const [postData, setPostData] = useState<any>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  // Hàm chuyển ảnh, kiểm tra an toàn dữ liệu
  const navigateImage = useCallback(
    (dir: number) => {
      const total = postData?.post?.image_urls?.length || 0;
      if (total === 0) return;
      let idx = currentImageIndex + dir;
      if (idx < 0) idx = total - 1;
      if (idx >= total) idx = 0;
      setCurrentImageIndex(idx);
    },
    [currentImageIndex, postData?.post?.image_urls?.length]
  );

  //Lấy user hiện tại
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (isLightboxOpen) {
        if (e.key === "ArrowLeft") navigateImage(-1);
        if (e.key === "ArrowRight") navigateImage(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLightboxOpen, currentImageIndex, navigateImage]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const base = formatImageUrl("") || "";
  // Attempt to hydrate post data from sessionStorage if navigated from list
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get("postId");
      if (postId) {
        const key = `selectedPost_${postId}`;
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          // map fields from ListPost shape to DetailPost expected shape when possible
          const mapped = {
            post: {
              _id: postId,
              title: parsed.title || "",
              description: parsed.description || "",
              price:
                typeof parsed.price === "number"
                  ? parsed.price
                  : parsed.price && !isNaN(Number(parsed.price)),
              transaction_type: parsed.transaction_type,
              condition: parsed.condition,
              category_id: parsed.category_id,
              image_urls: (() => {
                // Ưu tiên parsed.images nếu có
                if (Array.isArray(parsed.images)) {
                  return parsed.images
                    .map((img: any, i: number) => {
                      const rawUrl = img?.url || img; // phòng trường hợp chỉ là chuỗi
                      if (!rawUrl) return null;

                      // Nếu là đường dẫn tương đối → thêm prefix GCS
                      const fullUrl =
                        rawUrl.startsWith("/") || !/^https?:\/\//i.test(rawUrl)
                          ? `${rawUrl}`
                          : rawUrl;

                      return {
                        _id: img?._id || `img_${i}`,
                        url: fullUrl,
                        alt: img?.alt || `image_${i + 1}`,
                        tags: Array.isArray(img?.tags) ? img.tags : [],
                      };
                    })
                    .filter(Boolean);
                }

                // Nếu chỉ có 1 ảnh đơn lẻ imageUrl
                if (parsed.imageUrl) {
                  const rawUrl = parsed.imageUrl;
                  const fullUrl =
                    rawUrl.startsWith("/") || !/^https?:\/\//i.test(rawUrl)
                      ? `${rawUrl}`
                      : rawUrl;

                  return [
                    {
                      _id: "img_0",
                      url: fullUrl,
                      alt: "image_1",
                      tags: [],
                    },
                  ];
                }

                return [];
              })(),

              status: parsed.status,
              views: parsed.views || 0,
              updatedAt: parsed.updatedAt,
              createdAt: parsed.createdAt,
              author_id: parsed.author_id?._id,
            },
            user: {
              _id: parsed.author_id?._id,
              avatar: parsed.author_id?.avatar,
              full_name: parsed.author_id?.full_name,
              reputation: {
                total_score: parsed.author_id?.reputation?.total_score || 0,
                total_ratings: parsed.author_id?.reputation?.total_ratings || 0,
              },
              review_count: parsed.author?.reviewCount || 0,
              post_count: parsed.author?.post_count || 0,
              is_verified: parsed.author?.email_verified || true,
            },
            location: {
              address_text: (() => {
                try {
                  if (typeof parsed.location === "string")
                    return parsed.location;
                  const addr = parsed.location?.address;
                  if (typeof addr === "string") return addr;
                  if (addr && typeof addr === "object") {
                    return (
                      addr.address ||
                      addr.formattedAddress ||
                      addr.label ||
                      JSON.stringify(addr)
                    );
                  }
                  if (typeof parsed.location?.formattedAddress === "string")
                    return parsed.location.formattedAddress;
                } catch {}
              })(),
            },
          };
          // debug: if image_urls is empty, log parsed images for troubleshooting
          if (!mapped.post.image_urls || mapped.post.image_urls.length === 0) {
            try {
              console.warn(
                "DetailPost hydration: no images mapped",
                parsed.images,
                parsed.imageUrl
              );
            } catch {}
          }
          setPostData(mapped);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-scroll thumbnail into view when current image changes
  useEffect(() => {
    const thumbs = thumbsRef.current;
    if (!thumbs) return;
    // select by data attribute so this works with CSS modules (no hardcoded class names)
    const active = thumbs.querySelector(
      `[data-thumb-index="${currentImageIndex}"]`
    ) as HTMLElement | null;
    if (active)
      active.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
  }, [currentImageIndex]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);

  const handleSetImage = (idx: number) => setCurrentImageIndex(idx);

  //Favorite
  useEffect(() => {
    const checkFavorite = async () => {
      if (!postData?.post?._id || !currentUser?._id) return;
      const res = await axios.get(
        `http://localhost:8080/api/favorites/${currentUser._id}/${postData.post._id}`
      );
      setIsFavorite(res.data);
    };
    checkFavorite();
  }, [postData?.post?._id, currentUser?._id]);

  const toggleFavorite = React.useCallback(
    async (postId: string) => {
      if (!currentUser?._id) {
        alert("Vui lòng đăng nhập để thực hiện chức năng này.");
        return;
      }

      // 🔍 Gọi API kiểm tra trạng thái yêu thích hiện tại
      let isCurrentlyFavorited = false;
      try {
        const res = await axios.get(
          `http://localhost:8080/api/favorites/${currentUser._id}/${postId}`
        );
        isCurrentlyFavorited = res.data === true;
      } catch {
        isCurrentlyFavorited = false;
      }

      try {
        if (isCurrentlyFavorited) {
          //  Xóa khỏi favorites
          await axios.delete(
            `http://localhost:8080/api/favorites/post/${postId}`,
            {
              data: { user_id: currentUser._id },
            }
          );

          setIsFavorite(false);
        } else {
          //  Thêm vào favorites
          await axios.post(`http://localhost:8080/api/favorites`, {
            user_id: currentUser?._id,
            post_id: postId,
          });

          setIsFavorite(true);
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái yêu thích:", error);
        alert("Đã xảy ra lỗi khi cập nhật yêu thích.");
      }
    },
    [currentUser]
  );

  // Description truncation helper
  const DESCRIPTION_TRUNCATE = 300; // characters
  const needsTruncate = (text: string) => text.length > DESCRIPTION_TRUNCATE;
  const getShortDescription = (text: string) =>
    text.length > DESCRIPTION_TRUNCATE
      ? text.slice(0, DESCRIPTION_TRUNCATE).trimEnd() + "..."
      : text;

  // Tính giá, kiểm tra an toàn dữ liệu
  const price =
    postData?.post?.price !== undefined
      ? formatCurrency(postData.post.price)
      : "";

  //Tính điểm đánh giá
  const reputationScore = (data: any) => {
    if (!data.reputation || data.reputation.total_ratings === 0) return 0;
    return parseFloat(
      (data.reputation.total_score / data.reputation.total_ratings).toFixed(1)
    );
  };

  const renderRating = (score: number) => {
    const full = Math.floor(score);
    const half = score % 1 !== 0;
    const items = [] as React.ReactNode[];
    for (let i = 0; i < 5; i++) {
      if (i < full)
        items.push(
          <Icon
            key={i}
            icon="lucide:star"
            className={`${styles["rating-star"]}`}
            width={16}
            height={16}
          />
        );
      else if (i === full && half)
        items.push(
          <Icon
            key={i}
            icon="lucide:star-half"
            className={`${styles["rating-star"]}`}
            width={16}
            height={16}
          />
        );
      else
        items.push(
          <Icon
            key={i}
            icon="lucide:star"
            className={`${styles["rating-star"]} ${styles["empty"]}`}
            width={16}
            height={16}
          />
        );
    }
    return <div className={`${styles["rating-stars"]}`}>{items}</div>;
  };

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

  // --- Conversation ---
  // Hàm tạo conversation, đảm bảo post_id là chuỗi và lưu post info vào localStorage để truyền context
  const handleCreateConversation = async () => {
    try {
      // Đảm bảo post_id là string
      const postId =
        typeof postData?.post?._id === "string"
          ? postData.post._id
          : postData?.post?._id?._id || "";
      const payload = {
        post_id: postId,
        participants: [currentUser?._id, postData?.user?._id],
      };
      // Lưu thông tin post vào localStorage để truyền sang trang chat
      // Lấy đúng url ảnh đầu tiên (dù là object hay string)
      let firstImage = "";
      if (Array.isArray(postData?.post?.image_urls)) {
        if (typeof postData.post.image_urls[0] === "string") {
          firstImage = postData.post.image_urls[0];
        } else if (postData.post.image_urls[0]?.url) {
          firstImage = postData.post.image_urls[0].url;
        }
      }
      const postInfo = {
        post_id: postId,
        title: postData?.post?.title,
        image: firstImage,
        price: postData?.post?.price,
        author_id: postData?.user?._id,
      };
      localStorage.setItem("chat_post_info", JSON.stringify(postInfo));

      // Tạo conversation
      const res = await axios.post(
        "http://localhost:8080/api/conversations",
        payload
      );

      // Gửi system message chứa thông tin sản phẩm ngay sau khi tạo conversation
      try {
        // Xác định vai trò buyer/seller
        const buyerId = currentUser?._id;
        const sellerId = postData?.user?._id;
        // Tạo message object
        const systemMessage = {
          conversation_id: res.data._id,
          sender_id: "system", // Đánh dấu là tin nhắn hệ thống
          type: "system",
          content: {
            post_id: postId,
            title: postData?.post?.title,
            image: firstImage,
            price: postData?.post?.price,
            transaction_type: postData?.post?.transaction_type,
            seller_id: sellerId,
            buyer_id: buyerId,
            // Có thể bổ sung thêm các trường cần thiết cho UI
          },
          created_at: new Date().toISOString(),
        };
        // Gửi message lên backend
        await axios.post("http://localhost:8080/api/messages", systemMessage);
      } catch (err) {
        // Nếu gửi message lỗi thì vẫn cho user vào chat, chỉ log cảnh báo
        console.warn("Không thể gửi system message sản phẩm:", err);
      }

      // Chuẩn hóa dữ liệu conversation trước khi lưu localStorage
      const conversationToSave = {
        ...res.data,
        post_id: postId, // Lưu post_id là chuỗi
        participants: [
          {
            _id: currentUser?._id,
            full_name: currentUser?.full_name,
            avatar: currentUser?.avatar || "",
          },
          {
            _id: postData?.user?._id,
            full_name: postData?.user?.full_name,
            avatar: postData?.user?.avatar || "",
          },
        ],
      };

      localStorage.setItem("conversation", JSON.stringify(conversationToSave));
      router.push(`/conversation/${res.data._id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  //button sell,give away, exchange
  const badgeClassFor = React.useCallback((postType: string) => {
    switch (postType) {
      case "sell":
        return styles["post-badge-ban"];
      case "exchange":
        return styles["post-badge-trao"];
      case "give away":
        return styles["post-badge-tang"];
      default:
        return styles["post-badge-default"] || ""; // Provide a default class or empty string
    }
  }, []);

  const setTransactionType = (type: string) => {
    switch (type) {
      case "sell":
        return " Mua Ngay";
      case "give away":
        return "Nhận Miễn Phí";
      case "exchange":
        return "Đổi Sản Phẩm";
      default:
        return type;
    }
  };

  const setTransactionIcon = (type: string) => {
    switch (type) {
      case "sell":
        return "icon-park-outline:buy";
      case "give away":
        return "mdi:gift-outline";
      case "exchange":
        return "mdi:briefcase-exchange-outline";
      default:
        return type;
    }
  };

  //tách chuỗi
  const extractStringAfterLastComma = (fullString: string): string => {
    if (!fullString || typeof fullString !== "string") {
      return "";
    }

    const lastCommaIndex = fullString.lastIndexOf(",");
    if (lastCommaIndex === -1) {
      return "";
    }
    const result = fullString.slice(lastCommaIndex + 1);
    return result.trim();
  };

  return (
    <div className={`${styles["detail-post"]}`}>
      <div className={`${styles["container"]}`}>
        {isLoading ? (
          <div id="loading-skeleton" className={styles["loading-skeleton"]}>
            <div className={styles["skelHeader"]} />
            <div className={styles["skelGrid"]}>
              <div className={styles["skelLeft"]}>
                <div className={styles["skelLargeImage"]} />
                <div className={styles["skelThumbsGrid"]}>
                  <div className={styles["skelThumb"]} />
                  <div className={styles["skelThumb"]} />
                  <div className={styles["skelThumb"]} />
                  <div className={styles["skelThumb"]} />
                </div>
                <div className={styles["skelWide"]} />
                <div className={styles["skelMedium"]} />
                <div className={styles["skelTextGroup"]}>
                  <div className={styles["skelTextFull"]} />
                  <div className={styles["skelTextLarge"]} />
                  <div className={styles["skelTextMedium"]} />
                </div>
              </div>
              <div className={styles["skelRight"]}>
                <div className={styles["sellerBox"]}>
                  <div className={styles["sellerHead"]}>
                    <div className={styles["skelAvatar"]} />
                    <div className={styles["sellerMetaLines"]}>
                      <div className={styles["skelLineShort"]} />
                      <div className={styles["skelLineTiny"]} />
                    </div>
                  </div>
                  <div className={styles["skelInput"]} />
                </div>
                <div className={styles["skelSticky"]} />
              </div>
            </div>
          </div>
        ) : (
          <div id="main-content">
            {/* Breadcrumb điều hướng */}
            <Breadcrumb
              categoryName={postData.post?.category_id?.name}
              categorySlug={postData.post?.category_id?.slug}
              categoryId={postData.post?.category_id?._id}
              address={extractStringAfterLastComma(
                postData.location?.address_text
              )}
              postTitle={postData.post?.title}
              showIcons={true}
            />
            <article className={styles["main-article"]}>
              <div className={styles["left-col"]}>
                <div className={styles["header-row"]}>
                  <h1 id="post-title" className={styles["title"]}>
                    {postData.post.title}
                  </h1>
                  <div className={styles["action-buttons"]}>
                    <button aria-label="share">
                      <Icon icon="lucide:share-2" width={20} height={20} />
                    </button>
                    <button aria-label="report">
                      <Icon icon="lucide:flag" width={20} height={20} />
                    </button>
                  </div>
                </div>
                {/* Gallery ảnh */}
                <Gallery
                  imageUrls={postData?.post?.image_urls || []}
                  currentImageIndex={currentImageIndex}
                  onSetImage={handleSetImage}
                  onOpenLightbox={openLightbox}
                  onNavigateImage={navigateImage}
                  thumbsRef={thumbsRef}
                  formatImageUrl={formatImageUrl}
                />
                {/* Thông tin sản phẩm */}
                <InfoCard
                  price={price}
                  transactionType={postData?.post?.transaction_type}
                  status={postData?.post?.status}
                  condition={postData?.post?.condition}
                  views={postData?.post?.views || 0}
                  updatedAt={postData?.post?.updatedAt}
                  getRelativeTime={getRelativeTime}
                />
                {/* Mô tả chi tiết */}
                <DescriptionCard
                  description={postData?.post?.description || ""}
                  isDescExpanded={isDescExpanded}
                  setIsDescExpanded={setIsDescExpanded}
                  needsTruncate={needsTruncate}
                  getShortDescription={getShortDescription}
                  descRef={descRef}
                />
              </div>
              <aside className={styles["right-col"]}>
                <div className={styles["desktop-sticky-sidebar"]}>
                  {/* Thông tin người bán */}
                  <SellerCard
                    user={postData.user || {}}
                    createRipple={createRipple}
                    reputationScore={reputationScore}
                    renderRating={renderRating}
                  />
                  <div className={styles["spacer-sm"]} />
                  {/* Khu vực CTA */}
                  <CTAArea
                    post={postData.post || {}}
                    currentUser={currentUser}
                    isFavorite={isFavorite}
                    badgeClassFor={badgeClassFor}
                    setTransactionIcon={setTransactionIcon}
                    setTransactionType={setTransactionType}
                    createRipple={createRipple}
                    handleCreateConversation={handleCreateConversation}
                    toggleFavorite={toggleFavorite}
                    router={router}
                  />
                  <div className={styles["spacer-sm"]} />
                  {/* Địa chỉ giao dịch */}
                  <LocationBox
                    address={postData.location?.address_text || ""}
                  />
                </div>
              </aside>
            </article>
          </div>
        )}

        {/* Lightbox xem ảnh lớn */}
        <Lightbox
          isOpen={isLightboxOpen}
          imageUrls={postData?.post?.image_urls || []}
          currentImageIndex={currentImageIndex}
          onClose={closeLightbox}
          onNavigateImage={navigateImage}
          formatImageUrl={formatImageUrl}
        />
        {/* Mobile sticky footer CTA */}
        {/* Footer CTA cho mobile */}
        <MobileFooter
          isFavorite={isFavorite}
          onToggleFavorite={() =>
            postData?.post?._id && toggleFavorite(postData.post._id)
          }
          onAction={() => {
            if (postData?.post?.transaction_type === "sell") {
              if (!postData?.post?._id || !postData?.post?.title) {
                alert("Dữ liệu sản phẩm không hợp lệ. Vui lòng tải lại trang.");
                return;
              }
              // Lưu dữ liệu vào sessionStorage trước khi navigate
              try {
                const dataToStore = {
                  _id: postData.post._id,
                  post_id: postData.post._id,
                  title: postData.post.title,
                  price: postData.post.price,
                  condition: postData.post.condition,
                  transaction_type: postData.post.transaction_type,
                  images: postData.post.image_urls,
                  location: postData.location,
                  author_id: postData.user,
                };
                sessionStorage.setItem(
                  `selectedPost_${postData.post._id}`,
                  JSON.stringify(dataToStore)
                );
              } catch (err) {
                // Không block navigation
              }
              router.push(`/payment?postId=${postData.post._id}`);
            } else {
              handleCreateConversation();
            }
          }}
          transactionType={postData?.post?.transaction_type}
        />
      </div>
    </div>
  );
};

export default DetailPostPage;
