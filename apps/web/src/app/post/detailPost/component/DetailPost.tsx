"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./DetailPost.module.scss";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import axios from "@/lib/api-client";
import { formatImageUrl, URL_GCS } from "@/lib/constants";
import Image from "next/image";

// Helper to create a ripple span on a button. Call from button onClick: createRipple(e)
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

type User = {
  user_id?: string;
  avatar_url?: string;
  name: string;
  reputation?: {
    total_score: number;
    total_ratings: number;
  };
  review_count?: number;
  post_count?: number;
  is_verified?: boolean;
};

type Comment = {
  id: number;
  user: { name: string; avatar: string };
  text: string;
  time: string;
  likes: number;
  replies: Array<any>;
};

const mockData = {
  post: {
    title: "Ghế Gaming Ergonomic Cao Cấp - Thanh Lý Gấp, Mới 99%",
    description: `Mình cần thanh lý gấp chiếc ghế gaming ergonomic cao cấp mới mua 3 tháng do chuyển nhà, không còn không gian để sử dụng.\n\n- Tình trạng: Mới 99%, không một vết xước, đầy đủ hộp và phụ kiện.\n- Tính năng nổi bật: Hỗ trợ thắt lưng 4D, ngả lưng 170 độ, đệm lưới thoáng khí cao cấp (mesh).\n- Lý do bán: Chuyển sang căn hộ nhỏ hơn, ưu tiên không gian sinh hoạt.\n\nGiá niêm yết là 7.500.000₫. Mình thanh lý nhanh 4.500.000₫.\nƯu tiên giao dịch nhanh trong tuần này. Có thể trao đổi với một chiếc máy đọc sách Kindle Paperwhite mới.\n\nLưu ý: Vui lòng chat trước khi gọi điện. Cảm ơn!`,
    price: 4500000,
    exchange_type: "Bán/Trao đổi",
    condition: "Gần như mới (99%)",
    image_urls: [
      "https://placehold.co/1200x800/22c55e/ffffff?text=Ghế+Chính+1",
      "https://placehold.co/1200x800/10b981/ffffff?text=Lưới+Thoáng+Khí+2",
      "https://placehold.co/1200x800/059669/ffffff?text=Hỗ+trợ+Lưng+4D+3",
      "https://placehold.co/1200x800/14b8a6/ffffff?text=Cận+Cảnh+Tay+Vịn+4",
      "https://placehold.co/1200x800/06b6d4/ffffff?text=Ảnh+Góc+Nghiêng+5",
    ],
    status: "Active",
    views: 1258,
    created_at: "2 giờ trước",
    user_id: "user-abc-123",
  },
  user: {
    user_id: "user-abc-123",
    avatar_url: "https://placehold.co/60x60/3b82f6/ffffff?text=JH",
    name: "Jason Hoàng",
    reputation_score: 4.8,
    review_count: 52,
    post_count: 12,
    is_verified: true,
  } as User,
  location: {
    address_text: "Tòa S2.05, Vinhomes Ocean Park, Gia Lâm, Hà Nội",
    city: "Hà Nội",
    lat: 21.018155,
    lng: 105.952134,
  },
  similar_products: [
    {
      id: 1,
      title: "Bàn phím cơ TKL, switch Brown",
      price: 900000,
      img: "https://placehold.co/300x200/f87171/ffffff?text=Keyboard",
      tag: "Hot",
      condition: "Tốt (85%)",
      exchange_type: "Bán",
      seller: {
        name: "Thanh P",
        avatar: "https://placehold.co/30x30/fecaca/991b1b?text=T",
        rating: 4.2,
        distance_km: 0.8,
      },
    },
    {
      id: 2,
      title: "Máy đọc sách Kindle Paperwhite 4",
      price: 1800000,
      img: "https://placehold.co/300x200/fbbf24/ffffff?text=Kindle",
      tag: "New",
      condition: "Gần như mới (99%)",
      exchange_type: "Trao đổi",
      seller: {
        name: "Minh T",
        avatar: "https://placehold.co/30x30/dbeafe/1e40af?text=M",
        rating: 4.9,
        distance_km: 3.4,
      },
    },
    {
      id: 3,
      title: "Đèn LED để bàn chống cận",
      price: 250000,
      img: "https://placehold.co/300x200/34d399/ffffff?text=Đèn+LED",
      tag: "",
      condition: "Cũ (70%)",
      exchange_type: "Miễn phí",
      seller: {
        name: "Lan H",
        avatar: "https://placehold.co/30x30/d1fae5/065f46?text=L",
        rating: 4.6,
        distance_km: 1.2,
      },
    },
    {
      id: 4,
      title: "Tai nghe Sony WH-1000XM4 (Cũ)",
      price: 3500000,
      img: "https://placehold.co/300x200/60a5fa/ffffff?text=Tai+Nghe",
      tag: "Hot",
      condition: "Tốt (80%)",
      exchange_type: "Bán",
      seller: {
        name: "Hoàng V",
        avatar: "https://placehold.co/30x30/f0f9ff/0c4a6e?text=H",
        rating: 4.4,
        distance_km: 7.6,
      },
    },
    {
      id: 5,
      title: "Giá đỡ màn hình kép Ergo",
      price: 500000,
      img: "https://placehold.co/300x200/c084fc/ffffff?text=Giá+Đỡ",
      tag: "New",
      condition: "Mới (100%)",
      exchange_type: "Bán",
      seller: {
        name: "Trang K",
        avatar: "https://placehold.co/30x30/ede9fe/6d28d9?text=T",
        rating: 5.0,
        distance_km: 0.4,
      },
    },
    {
      id: 6,
      title: "Quạt điều hoà mini cầm tay",
      price: 150000,
      img: "https://placehold.co/300x200/f0f9ff/0c4a6e?text=Quạt+Mini",
      tag: "",
      condition: "Cũ (60%)",
      exchange_type: "Miễn phí",
      seller: {
        name: "Anh D",
        avatar: "https://placehold.co/30x30/e0f2f1/0f766e?text=A",
        rating: 4.1,
        distance_km: 12.3,
      },
    },
  ],
  comments: [] as Comment[],
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n
  );

export const DetailPost: React.FC = () => {
  const router = useRouter();
  const [postData, setPostData] = useState<any>(mockData);
  // track favorites per similar product by id
  const [cardFavorites, setCardFavorites] = useState<Record<number, boolean>>(
    {}
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: {
        name: "Nguyễn Văn A",
        avatar: "https://placehold.co/40x40/f43f5e/ffffff?text=U2",
      },
      text: "Ghế đẹp quá! Cho mình xin thêm ảnh mặt sau và ảnh chụp phần đệm lưới khi ngồi được không ạ? Mình đang rất quan tâm!",
      time: "2 giờ trước",
      likes: 2,
      replies: [
        {
          id: 101,
          user: {
            name: "Jason Hoàng",
            is_seller: true,
            avatar: "https://placehold.co/40x40/3b82f6/ffffff?text=JH",
          },
          text: "@Nguyễn Văn A: Cảm ơn bạn! Mình vừa gửi ảnh chi tiết qua chatbox rồi nhé. Bạn check tin nhắn giúp mình nha!",
          time: "1 giờ trước",
        },
      ],
    },
    {
      id: 2,
      user: {
        name: "Trần Thị B",
        avatar: "https://placehold.co/40x40/10b981/ffffff?text=U3",
      },
      text: "Giá này có fix không bạn? Mình ở Hà Nội, nếu tiện mình qua xem trực tiếp luôn.",
      time: "30 phút trước",
      likes: 0,
      replies: [],
    },
  ]);

  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  const navigateImage = useCallback(
    (dir: number) => {
      const total = postData.post.image_urls.length;
      let idx = currentImageIndex + dir;
      if (idx < 0) idx = total - 1;
      if (idx >= total) idx = 0;
      setCurrentImageIndex(idx);
    },
    [currentImageIndex, postData.post.image_urls.length]
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

  // simulate loading similar to original HTML (skeleton)
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
              title: parsed.title || mockData.post.title,
              description: parsed.description || mockData.post.description,
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
              views: parsed.views || mockData.post.views,
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
              review_count:
                parsed.author?.reviewCount || mockData.user.review_count,
              post_count: parsed.author?.post_count || mockData.user.post_count,
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
            similar_products: mockData.similar_products,
            comments: mockData.comments,
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
      if (!postData.post._id || !currentUser?._id) return;
      const res = await axios.get(
        `http://localhost:8080/api/favorites/${currentUser._id}/${postData.post._id}`
      );
      setIsFavorite(res.data);
    };
    checkFavorite();
  }, [postData.post._id, currentUser?._id]);

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
            user_id: currentUser._id,
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

  // Toggle favorite for a product card by id
  const toggleCardFavorite = (id: number) => {
    setCardFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Ripple will be created manually via createRipple in button onClick handlers

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const textarea = form.elements.namedItem("comment") as HTMLTextAreaElement;
    const text = textarea.value.trim();
    if (!text) return;
    const newComment: Comment = {
      id: Date.now(),
      user: {
        name: "User Mới",
        avatar: "https://placehold.co/40x40/94a3b8/ffffff?text=U",
      },
      text,
      time: "vừa xong",
      likes: 0,
      replies: [],
    };
    setComments((prev) => [newComment, ...prev]);
    textarea.value = "";
  };

  // Description truncation helper
  const DESCRIPTION_TRUNCATE = 300; // characters
  const needsTruncate = (text: string) => text.length > DESCRIPTION_TRUNCATE;
  const getShortDescription = (text: string) =>
    text.length > DESCRIPTION_TRUNCATE
      ? text.slice(0, DESCRIPTION_TRUNCATE).trimEnd() + "..."
      : text;

  const price = formatCurrency(postData.post.price);

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
  const handleCreateConversation = async () => {
    // if (!post || !currentUser || !user?._id) return;

    try {
      const payload = {
        post_id: postData.post._id,
        participants: [currentUser._id, postData.user._id],
      };
      console.log("Creating conversation with payload:", payload);
      const res = await axios.post(
        "http://localhost:8080/api/conversations",
        payload
      );

      // Chuẩn hóa dữ liệu conversation trước khi lưu localStorage
      const conversationToSave = {
        ...res.data,
        post_id: {
          _id: postData.post._id,
          title: postData.post.title,
          images: postData.post.image_urls,
          author_id: postData.user,
          category_id: postData.post.category_id?.name || "",
          price: postData.post.price,
          description: postData.post.description || "",
          condition: postData.post.condition,
          transaction_type: postData.post.transaction_type,
          status: postData.post.status,
          createdAt: postData.post.createdAt,
          updatedAt: postData.post.updatedAt,
        },
        participants: [
          {
            _id: currentUser._id,
            full_name: currentUser.full_name,
            avatar: currentUser.avatar || "",
          },
          {
            _id: postData.user._id,
            full_name: postData.user.full_name,
            avatar: postData.user.avatar || "",
          },
        ],
      };

      console.log("Created conversation:", conversationToSave);
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
          <div
            id="loading-skeleton"
            className={`${styles["loading-skeleton"]}`}
          >
            <div className={`${styles["skelHeader"]}`} />
            <div className={`${styles["skelGrid"]}`}>
              <div className={`${styles["skelLeft"]}`}>
                <div className={`${styles["skelLargeImage"]}`} />

                <div className={`${styles["skelThumbsGrid"]}`}>
                  <div className={`${styles["skelThumb"]}`} />
                  <div className={`${styles["skelThumb"]}`} />
                  <div className={`${styles["skelThumb"]}`} />
                  <div className={`${styles["skelThumb"]}`} />
                </div>

                <div className={`${styles["skelWide"]}`} />
                <div className={`${styles["skelMedium"]}`} />

                <div className={`${styles["skelTextGroup"]}`}>
                  <div className={`${styles["skelTextFull"]}`} />
                  <div className={`${styles["skelTextLarge"]}`} />
                  <div className={`${styles["skelTextMedium"]}`} />
                </div>
              </div>

              <div className={`${styles["skelRight"]}`}>
                <div className={`${styles["sellerBox"]}`}>
                  <div className={`${styles["sellerHead"]}`}>
                    <div className={`${styles["skelAvatar"]}`} />
                    <div className={`${styles["sellerMetaLines"]}`}>
                      <div className={`${styles["skelLineShort"]}`} />
                      <div className={`${styles["skelLineTiny"]}`} />
                    </div>
                  </div>
                  <div className={`${styles["skelInput"]}`} />
                </div>
                <div className={`${styles["skelSticky"]}`} />
              </div>
            </div>
          </div>
        ) : (
          <div id="main-content">
            <p>
              Say2hand &gt; {postData.post.category_id.name} &gt;{" "}
              {extractStringAfterLastComma(postData.location.address_text)}
            </p>
            <article className={`${styles["main-article"]}`}>
              <div className={`${styles["left-col"]}`}>
                <div className={`${styles["header-row"]}`}>
                  <h1 id="post-title" className={`${styles["title"]}`}>
                    {postData.post.title}
                  </h1>
                  <div className={`${styles["action-buttons"]}`}>
                    <button aria-label="share">
                      <Icon icon="lucide:share-2" width={20} height={20} />
                    </button>
                    <button aria-label="report">
                      <Icon icon="lucide:flag" width={20} height={20} />
                    </button>
                  </div>
                </div>

                <div className={`${styles["gallery-card"]}`}>
                  <div
                    id="main-image-container"
                    className={`${styles["main-image-container"]}`}
                    onClick={() => openLightbox(currentImageIndex)}
                  >
                    {/* Sử dụng Image của Next.js cho ảnh chính */}
                    <Image
                      id="main-image"
                      src={
                        formatImageUrl(
                          postData.post.image_urls[currentImageIndex].url
                        ) || ""
                      }
                      alt="main"
                      width={600}
                      height={400}
                      className=""
                    />
                    <div
                      id="image-count"
                      className={`${styles["image-count"]}`}
                    >
                      {currentImageIndex + 1}/{postData.post.image_urls.length}
                    </div>
                    <button
                      className={`${styles["nav-arrow"]} ${styles["left"]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage(-1);
                      }}
                      aria-label="Ảnh trước"
                    >
                      <Icon icon="lucide:chevron-left" width={18} height={18} />
                    </button>
                    <button
                      className={`${styles["nav-arrow"]} ${styles["right"]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage(1);
                      }}
                      aria-label="Ảnh sau"
                    >
                      <Icon
                        icon="lucide:chevron-right"
                        width={18}
                        height={18}
                      />
                    </button>
                  </div>

                  <div
                    id="thumbnail-gallery"
                    className={`${styles["thumbs"]}`}
                    ref={thumbsRef}
                  >
                    {postData.post.image_urls.map(
                      (imageUrl: any, idx: number) => (
                        <div
                          key={idx}
                          data-thumb-index={idx}
                          className={`${styles["thumb"]} ${
                            idx === currentImageIndex
                              ? `${styles["active"]}`
                              : ""
                          }`}
                          onClick={() => handleSetImage(idx)}
                        >
                          {/* Sử dụng Image của Next.js cho thumbnail */}
                          <Image
                            src={formatImageUrl(imageUrl.url) || ""}
                            alt={`thumb-${idx}`}
                            width={60}
                            height={40}
                            className=""
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className={`${styles["info-card"]}`}>
                  <div className={`${styles["price-row"]}`}>
                    <div id="post-price" className={`${styles["price"]}`}>
                      {postData.post.transaction_type === "give away"
                        ? "Miễn phí"
                        : postData.post.transaction_type === "exchange"
                          ? "Trao đổi"
                          : price}
                    </div>
                    <div
                      id="post-status"
                      className={`${styles["status-badge"]}`}
                    >
                      {postData.post.status === "active"
                        ? "Đang Bán"
                        : "Đã Bán"}
                    </div>
                  </div>

                  <div className={`${styles["meta-grid"]}`}>
                    <div className={`${styles["meta-item"]}`}>
                      <Icon icon="lucide:repeat" width={14} height={14} />
                      &nbsp;<strong>Hình thức:</strong>&nbsp;
                      <span id="post-type">
                        {postData.post.transaction_type === "give away"
                          ? "Miễn phí"
                          : postData.post.transaction_type === "trade"
                            ? "Trao đổi"
                            : postData.post.transaction_type === "sell"
                              ? "Bán"
                              : "Khác"}
                      </span>
                    </div>
                    <div className={`${styles["meta-item"]}`}>
                      <Icon icon="lucide:package" width={14} height={14} />
                      &nbsp;<strong>Tình trạng:</strong>&nbsp;
                      <span id="post-condition">
                        {postData.post.condition === "new"
                          ? "Mới "
                          : postData.post.condition === "like new"
                            ? "Gần như mới"
                            : postData.post.condition === "used"
                              ? "Đã sử dụng"
                              : postData.post.condition === "minor flow"
                                ? "Hư nhẹ"
                                : postData.post.condition === "for repair"
                                  ? "Cần sửa chữa"
                                  : postData.post.condition === "not working"
                                    ? "Không hoạt động"
                                    : "Khác"}
                      </span>
                    </div>
                    <div className={`${styles["meta-item"]}`}>
                      <Icon icon="lucide:eye" width={14} height={14} />
                      &nbsp;<strong>Lượt xem:</strong>&nbsp;
                      <span id="post-views">
                        {postData.post.views.toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className={`${styles["meta-item"]}`}>
                      <Icon icon="lucide:clock" width={14} height={14} />
                      &nbsp;<strong>Đăng lúc:</strong>&nbsp;
                      <span id="post-created-at">
                        {getRelativeTime(postData.post.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <section className={`${styles["description-card"]}`}>
                  <h2>Mô Tả Chi Tiết</h2>
                  <div
                    id="description-container"
                    className={`${styles["relative"]} ${styles["overflow-hidden"]}`}
                  >
                    <p
                      id="post-description"
                      ref={descRef}
                      className={`${styles["description-text"]} ${
                        isDescExpanded ? "expanded" : "collapsed"
                      }`}
                    >
                      {isDescExpanded
                        ? postData.post.description
                        : getShortDescription(postData.post.description)}
                    </p>
                  </div>
                  {needsTruncate(postData.post.description) && (
                    <button
                      id="read-more-btn"
                      className={`${styles["read-more-btn"]}`}
                      onClick={() => setIsDescExpanded((v) => !v)}
                    >
                      {isDescExpanded ? "Thu gọn" : "Xem thêm..."}
                    </button>
                  )}
                </section>

                <section className={`${styles["comments-card"]}`}>
                  <h2>
                    Bình Luận (
                    <span id="comment-count-display">{comments.length}</span>)
                  </h2>
                  {isLoading && (
                    <div className={`${styles["skeleton-line"]}`} />
                  )}
                  <div className={`${styles["comment-input-row"]}`}>
                    {/* Sử dụng Image của Next.js cho avatar người dùng */}
                    <Image
                      src={
                        formatImageUrl(postData.user.avatar) ||
                        "/image/header/carbon_user-avatar-filled-alt.svg"
                      }
                      alt="Your Avatar"
                      width={40}
                      height={40}
                      className=""
                    />
                    <form
                      className={`${styles["comment-form"]}`}
                      onSubmit={handleSubmitComment}
                    >
                      <textarea
                        id="comment-input"
                        name="comment"
                        className={`${styles["comment-input"]}`}
                        placeholder="Chia sẻ ý kiến hoặc hỏi người bán..."
                      ></textarea>
                      <div className={`${styles["comment-submit-wrap"]}`}>
                        <button
                          type="submit"
                          className={`${styles["comment-submit-btn"]} ${styles["ripple-target"]}`}
                          onClick={(e) => {
                            createRipple(e as any);
                          }}
                        >
                          Gửi Bình Luận
                        </button>
                      </div>
                    </form>
                  </div>

                  <div
                    id="comment-list"
                    className={`${styles["comment-list"]}`}
                  >
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`${styles["comment-item"]}`}
                      >
                        {/* Sử dụng Image của Next.js cho avatar bình luận */}
                        <Image
                          src={comment.user.avatar || ""}
                          alt="avatar"
                          width={40}
                          height={40}
                          className=""
                        />
                        <div className={`${styles["comment-content"]}`}>
                          <div className={`${styles["comment-box"]}`}>
                            <p className={`${styles["author"]}`}>
                              {comment.user.name}
                            </p>
                            <p className={`${styles["text"]}`}>
                              {comment.text}
                            </p>
                          </div>
                          <div className={`${styles["comment-meta"]}`}>
                            {comment.time} &nbsp; • &nbsp;{" "}
                            <button
                              className={`${styles["meta-action"]}`}
                              onClick={() => {}}
                            >
                              Trả lời
                            </button>
                          </div>
                          {comment.replies &&
                            comment.replies.map((reply: any) => (
                              <div
                                key={reply.id}
                                className={`${styles["reply-row"]}`}
                              >
                                {/* Sử dụng Image của Next.js cho avatar trả lời */}
                                <Image
                                  src={reply.user.avatar || ""}
                                  alt="reply"
                                  width={32}
                                  height={32}
                                  className={styles["reply-avatar"]}
                                />
                                <div className={`${styles["reply-content"]}`}>
                                  <div className={`${styles["reply-box"]}`}>
                                    <p className={`${styles["author"]}`}>
                                      {reply.user.name} <span>(Người bán)</span>
                                    </p>
                                    <p className={`${styles["text"]}`}>
                                      {reply.text}
                                    </p>
                                  </div>
                                  <div className={`${styles["reply-time"]}`}>
                                    {reply.time}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className={`${styles["right-col"]}`}>
                <div className={`${styles["desktop-sticky-sidebar"]}`}>
                  <div className={`${styles["seller-card"]}`}>
                    <div className={`${styles["seller-head"]}`}>
                      {/* Sử dụng Image của Next.js cho avatar seller */}
                      <Image
                        src={
                          formatImageUrl(postData.user.avatar) ||
                          "/image/header/carbon_user-avatar-filled-alt.svg"
                        }
                        alt="seller"
                        width={40}
                        height={40}
                        className=""
                      />
                      <div>
                        <div className={`${styles["seller-name"]}`}>
                          {postData.user.full_name}{" "}
                          {postData.user.is_verified ? (
                            <Icon
                              icon="lucide:badge-check"
                              className={`${styles["verified-icon"]}`}
                              width={16}
                              height={16}
                            />
                          ) : null}
                        </div>
                        <div className={`${styles["seller-meta"]}`}>
                          {postData.user.post_count} bài đăng khác
                        </div>
                        <div className={`${styles["seller-rep"]}`}>
                          {renderRating(reputationScore(postData.user) || 0)}{" "}
                          <span className={`${styles["seller-rep-text"]}`}>
                            {reputationScore(postData.user)}/5 (
                            {postData.user.review_count} đánh giá)
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      className={`${styles["profile-link"]} ${styles["ripple-target"]}`}
                      href="#"
                      onClick={(e) => {
                        createRipple(e as any);
                      }}
                    >
                      <span>Xem Trang Cá Nhân</span>
                      <Icon
                        icon="lucide:chevron-right"
                        width={16}
                        height={16}
                      />
                    </a>
                  </div>

                  <div className={`${styles["spacer-sm"]}`} />

                  <div
                    className={
                      postData?.post?.status === "active"
                        ? `${styles["cta-box"]}`
                        : `${styles["cta-box"]} ${styles["unClick"]}`
                    }
                  >
                    {postData.post.author_id !== currentUser._id ? (
                      <>
                        <button
                          type="button"
                          className={`${styles["post-type-badge"]} ${styles["ripple-target"]} ${badgeClassFor(postData.post.transaction_type)}`}
                          onClick={(e) => {
                            createRipple(e as any);
                            // Xử lý theo loại giao dịch
                            if (postData.post.transaction_type === "sell") {
                              // Validate post data trước khi lưu
                              if (!postData.post._id || !postData.post.title) {
                                console.error(
                                  "❌ Invalid post data:",
                                  postData.post
                                );
                                alert(
                                  "Dữ liệu sản phẩm không hợp lệ. Vui lòng tải lại trang."
                                );
                                return;
                              }

                              router.push(
                                `/payment?postId=${postData.post._id}`
                              );
                            } else if (
                              postData.post.transaction_type === "exchange"
                            ) {
                              // Nếu là trao đổi -> mở chat
                              handleCreateConversation();
                            } else if (
                              postData.post.transaction_type === "give away"
                            ) {
                              // Nếu là cho tặng -> mở chat
                              handleCreateConversation();
                            }
                          }}
                        >
                          <Icon
                            icon={setTransactionIcon(
                              postData.post.transaction_type
                            )}
                            width={18}
                            height={18}
                          />
                          &nbsp;{" "}
                          {setTransactionType(postData.post.transaction_type)}
                        </button>
                        <button
                          type="button"
                          className={`${styles["chat-btn"]} ${styles["ripple-target"]}`}
                          onClick={(e) => {
                            createRipple(e as any);
                            handleCreateConversation();
                            /* TODO: open chat modal */
                          }}
                        >
                          <Icon
                            icon="lucide:message-square"
                            width={16}
                            height={16}
                          />
                          &nbsp; Chat Ngay / Liên Hệ
                        </button>
                        <button
                          type="button"
                          className={`${styles["fav-btn"]} ${isFavorite ? styles["active"] : ""} ${styles["ripple-target"]}`}
                          onClick={(e) => {
                            createRipple(e as any);
                            toggleFavorite(postData.post._id!);
                          }}
                        >
                          <Icon icon="lucide:heart" width={16} height={16} />
                          &nbsp;{" "}
                          {isFavorite ? "Đã Lưu Yêu Thích" : "Lưu Yêu Thích"}
                        </button>
                      </>
                    ) : (
                      <div></div>
                    )}
                  </div>

                  <div className={`${styles["spacer-sm"]}`} />

                  <div className={`${styles["cta-box"]}`}>
                    <div className={`${styles["location-header"]}`}>
                      <Icon
                        className="icon-location"
                        icon="lucide:map-pin"
                        width={24}
                        height={24}
                      />
                      <p>Địa Chỉ Giao Dịch</p>
                    </div>
                    <p className={`${styles["muted-text"]}`}>
                      {postData.location.address_text}
                    </p>
                    <div className={`${styles["map-mock"]}`}>
                      Xem trên Bản đồ
                    </div>
                  </div>
                </div>
              </aside>
            </article>

            <section className={`${styles["similar-section"]}`}>
              <h2 className={`${styles["heading-pt"]}`}>
                Khám Phá Thêm Gần Bạn
              </h2>
              <div
                className={`${styles["similar-grid"]}`}
                id="similar-products"
              >
                {postData.similar_products.map((product: any) => {
                  const isFree = product.transaction_type === "Miễn phí";
                  const isTrade = product.transaction_type === "Trao đổi";
                  const isNewCond = /99%|100%|Mới/.test(
                    product.condition || ""
                  );
                  // local favorite state per card can be handled via DOM or lifted state; keep it simple with inline click toggle
                  return (
                    <a
                      key={product.id}
                      href="#"
                      className={`${styles["similar-product-card"]}`}
                    >
                      {/* {p.tag === "New" && (
                        <span className="badge badge-new">Mới</span>
                      )}
                      {p.tag === "Hot" && (
                        <span className="badge badge-hot">
                          <Zap size={12} /> HOT
                        </span>
                      )} */}

                      <button
                        className={`${styles["sp-fav-btn"]} ${styles["ripple-target"]}`}
                        aria-label={`Yêu thích ${product.title}`}
                        onClick={(e) => {
                          createRipple(e as any);
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCardFavorite(product.id);
                        }}
                      >
                        <span
                          className={`${styles["heartIcon"]} ${
                            cardFavorites[product.id]
                              ? styles["heartIconActive"]
                              : ""
                          }`}
                        >
                          <Icon
                            icon={
                              cardFavorites[product.id]
                                ? "ic:sharp-favorite"
                                : "ic:twotone-favorite"
                            }
                            width={20}
                            height={20}
                          />
                        </span>
                      </button>

                      <div className={`${styles["product-aspect"]}`}>
                        {/* Sử dụng Image của Next.js cho ảnh sản phẩm tương tự */}
                        <Image
                          src={formatImageUrl(product.img) || ""}
                          alt={product.title}
                          width={120}
                          height={80}
                          className=""
                        />
                      </div>

                      <div className={`${styles["card-body"]}`}>
                        <h4 className={`${styles["sp-title"]}`}>
                          {product.title}
                        </h4>

                        <div className={`${styles["chips"]}`}>
                          <span
                            className={`${styles["chip"]} ${styles["condition"]} ${
                              isNewCond ? `${styles["condition-new"]}` : ""
                            }`}
                          >
                            {(product.condition || "").split("(")[0].trim()}
                          </span>
                          {isFree ? (
                            <span
                              className={`${styles["chip"]} ${styles["exchange"]} ${styles["exchange-free"]}`}
                            >
                              Cho Tặng
                            </span>
                          ) : isTrade ? (
                            <span
                              className={`${styles["chip"]} ${styles["exchange"]} ${styles["exchange-trade"]}`}
                            >
                              Trao Đổi
                            </span>
                          ) : (
                            <span
                              className={`${styles["chip"]} ${styles["exchange"]} ${styles["exchange-sell"]}`}
                            >
                              Rao Bán
                            </span>
                          )}
                        </div>

                        <div className={`${styles["price-seller-col"]}`}>
                          <div className={`${styles["price-section"]}`}>
                            {isFree ? (
                              <span className={`${styles["price-free"]}`}>
                                MIỄN PHÍ
                              </span>
                            ) : isTrade ? (
                              <span className={`${styles["price-trade"]}`}>
                                TRAO ĐỔI
                              </span>
                            ) : (
                              <span className={`${styles["price-value"]}`}>
                                {formatCurrency(product.price)}
                              </span>
                            )}
                          </div>

                          <div className={`${styles["seller-small"]}`}>
                            <div className={`${styles["seller-avatar"]}`}>
                              <Image
                                src={
                                  formatImageUrl(product.seller.avatar) || ""
                                }
                                alt={product.seller.name}
                                width={30}
                                height={30}
                                className=""
                              />
                            </div>

                            <div className={`${styles["seller-meta-small"]}`}>
                              <div className={`${styles["seller-name-small"]}`}>
                                {product.seller.name}
                              </div>
                              {product.seller.rating !== undefined && (
                                <div
                                  className={`${styles["seller-rating-badge"]}`}
                                  title={`Đánh giá: ${product.seller.rating}`}
                                >
                                  <Icon
                                    icon="lucide:star"
                                    width={12}
                                    height={12}
                                  />
                                  &nbsp;{product.seller.rating.toFixed(1)}
                                </div>
                              )}
                            </div>

                            {product.seller.distance_km !== undefined && (
                              <div
                                className={`${styles["seller-distance"]}`}
                                title={`Khoảng cách: ${product.seller.distance_km} km`}
                              >
                                {product.seller.distance_km.toFixed(1)} km
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {isLightboxOpen && (
          <div
            className={`${styles["lightbox"]} ${styles["visible"]}`}
            onClick={closeLightbox}
          >
            <button
              className={`${styles["nav-arrow"]} ${styles["left"]}`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(-1);
              }}
              aria-label="Lightbox - previous"
            >
              <Icon icon="lucide:chevron-left" width={24} height={24} />
            </button>
            {/* Sử dụng Image của Next.js để tối ưu ảnh lightbox */}
            <Image
              src={
                formatImageUrl(
                  postData.post.image_urls[currentImageIndex].url
                ) || ""
              }
              alt="lightbox"
              width={800}
              height={600}
              onClick={(e) => e.stopPropagation()}
              className=""
            />
            <button
              className={`${styles["nav-arrow"]} ${styles["right"]}`}
              onClick={(e) => {
                e.stopPropagation();
                navigateImage(1);
              }}
              aria-label="Lightbox - next"
            >
              <Icon icon="lucide:chevron-right" width={24} height={24} />
            </button>
          </div>
        )}
        {/* Mobile sticky footer CTA */}
        <div className={`${styles["mobile-footer"]}`}>
          <div className={`${styles["mobile-footer-inner"]}`}>
            <button
              type="button"
              className={`${styles["fav-btn"]} ${isFavorite ? `${styles["active"]}` : ""}`}
              onClick={() => toggleFavorite(postData.post._id!)}
              aria-label="Lưu yêu thích"
            >
              {isFavorite ? "Đã Lưu" : "Lưu"}
            </button>
            <button
              type="button"
              className={`${styles["chat-btn"]}`}
              onClick={() => {
                // Xử lý theo loại giao dịch
                if (postData.post.transaction_type === "sell") {
                  // Validate post data trước khi lưu
                  if (!postData.post._id || !postData.post.title) {
                    console.error(
                      "❌ Invalid post data (mobile):",
                      postData.post
                    );
                    alert(
                      "Dữ liệu sản phẩm không hợp lệ. Vui lòng tải lại trang."
                    );
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
                    console.log(
                      "✅ Saved post data to sessionStorage (mobile):",
                      {
                        postId: postData.post._id,
                        title: postData.post.title,
                        hasImages: dataToStore.images?.length > 0,
                      }
                    );
                  } catch (err) {
                    console.error(
                      "❌ Error saving to sessionStorage (mobile):",
                      err
                    );
                    // Không block navigation
                  }
                  // Chuyển đến trang thanh toán
                  router.push(`/payment?postId=${postData.post._id}`);
                } else {
                  // Nếu là trao đổi hoặc cho tặng -> mở chat
                  handleCreateConversation();
                }
              }}
            >
              {postData.post.transaction_type === "sell"
                ? "Mua Ngay"
                : "Chat Ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPost;
