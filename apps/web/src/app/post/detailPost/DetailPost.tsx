"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import styles from "./DetailPost.module.scss";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { formatImageUrl } from "@/lib/constants";
import {
  LoadingSkeleton,
  ImageGallery,
  PostInfo,
  PostDescription,
  CommentSection,
  SellerCard,
  LocationCard,
  CTAButtons,
  SimilarProducts,
  Lightbox,
  MobileFooter,
} from "./components";

// Helper to create a ripple span on a button
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
    const existing = targetBtn.querySelector(".ripple-span");
    if (existing) existing.remove();
    const rect = targetBtn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-span";
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

type Comment = {
  id: number;
  user: { name: string; avatar: string };
  text: string;
  time: string;
  likes: number;
  replies: Array<any>;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n
  );

const mockData = {
  post: {
    title: "Ghế Gaming Ergonomic Cao Cấp - Thanh Lý Gấp, Mới 99%",
    description: `Mình cần thanh lý gấp chiếc ghế gaming ergonomic cao cấp mới mua 3 tháng do chuyển nhà, không còn không gian để sử dụng.

- Tình trạng: Mới 99%, không một vết xước, đầy đủ hộp và phụ kiện.
- Tính năng nổi bật: Hỗ trợ thắt lưng 4D, ngả lưng 170 độ, đệm lưới thoáng khí cao cấp (mesh).
- Lý do bán: Chuyển sang căn hộ nhỏ hơn, ưu tiên không gian sinh hoạt.

Giá niêm yết là 7.500.000₫. Mình thanh lý nhanh 4.500.000₫.
Ưu tiên giao dịch nhanh trong tuần này. Có thể trao đổi với một chiếc máy đọc sách Kindle Paperwhite mới.

Lưu ý: Vui lòng chat trước khi gọi điện. Cảm ơn!`,
    price: 4500000,
    exchange_type: "Bán/Trao đổi",
    condition: "Gần như mới (99%)",
    image_urls: [
      { url: "https://placehold.co/1200x800/22c55e/ffffff?text=Ghế+Chính+1" },
      { url: "https://placehold.co/1200x800/10b981/ffffff?text=Lưới+Thoáng+Khí+2" },
      { url: "https://placehold.co/1200x800/059669/ffffff?text=Hỗ+trợ+Lưng+4D+3" },
      { url: "https://placehold.co/1200x800/14b8a6/ffffff?text=Cận+Cảnh+Tay+Vịn+4" },
      { url: "https://placehold.co/1200x800/06b6d4/ffffff?text=Ảnh+Góc+Nghiêng+5" },
    ],
    status: "active",
    views: 1258,
    transaction_type: "sell",
    author_id: "user-abc-123",
    _id: "post-123",
    category_id: { name: "Đồ gia dụng" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  user: {
    _id: "user-abc-123",
    avatar: "https://placehold.co/60x60/3b82f6/ffffff?text=JH",
    full_name: "Jason Hoàng",
    reputation: {
      total_score: 24,
      total_ratings: 5,
    },
    review_count: 52,
    post_count: 12,
    is_verified: true,
  },
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
      condition: "Tốt (85%)",
      transaction_type: "Bán",
      seller: {
        name: "Thanh P",
        avatar: "https://placehold.co/30x30/fecaca/991b1b?text=T",
        rating: 4.2,
        distance_km: 0.8,
      },
    },
  ],
  comments: [] as Comment[],
};

export const DetailPost: React.FC = () => {
  const router = useRouter();
  const [postData, setPostData] = useState<any>(mockData);
  const [cardFavorites, setCardFavorites] = useState<Record<number, boolean>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: { name: "Nguyễn Văn A", avatar: "https://placehold.co/40x40/f43f5e/ffffff?text=U2" },
      text: "Ghế đẹp quá! Cho mình xin thêm ảnh mặt sau và ảnh chụp phần đệm lưới khi ngồi được không ạ? Mình đang rất quan tâm!",
      time: "2 giờ trước",
      likes: 2,
      replies: [{
        id: 101,
        user: { name: "Jason Hoàng", is_seller: true, avatar: "https://placehold.co/40x40/3b82f6/ffffff?text=JH" },
        text: "@Nguyễn Văn A: Cảm ơn bạn! Mình vừa gửi ảnh chi tiết qua chatbox rồi nhé. Bạn check tin nhắn giúp mình nha!",
        time: "1 giờ trước",
      }],
    },
  ]);

  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : { _id: "guest-user" });
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

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const postId = params.get("postId");
      if (postId) {
        const key = `selectedPost_${postId}`;
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const mapped = {
            post: { ...parsed, image_urls: parsed.images || [] },
            user: parsed.author_id || mockData.user,
            location: parsed.location || mockData.location,
            similar_products: mockData.similar_products,
            comments: mockData.comments,
          };
          setPostData(mapped);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const thumbs = thumbsRef.current;
    if (!thumbs) return;
    const active = thumbs.querySelector(`[data-thumb-index="${currentImageIndex}"]`) as HTMLElement | null;
    if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentImageIndex]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isLightboxOpen]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => setIsLightboxOpen(false);
  const handleSetImage = (idx: number) => setCurrentImageIndex(idx);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!postData.post._id || !currentUser?._id) return;
      try {
        const res = await axios.get(`http://localhost:8080/api/favorites/${currentUser._id}/${postData.post._id}`);
        setIsFavorite(res.data);
      } catch {}
    };
    checkFavorite();
  }, [postData.post._id, currentUser?._id]);

  const toggleFavorite = React.useCallback(
    async (postId: string) => {
      if (!currentUser?._id) {
        alert("Vui lòng đăng nhập để thực hiện chức năng này.");
        return;
      }

      let isCurrentlyFavorited = false;
      try {
        const res = await axios.get(`http://localhost:8080/api/favorites/${currentUser._id}/${postId}`);
        isCurrentlyFavorited = res.data === true;
      } catch {
        isCurrentlyFavorited = false;
      }

      try {
        if (isCurrentlyFavorited) {
          await axios.delete(`http://localhost:8080/api/favorites/post/${postId}`, { data: { user_id: currentUser._id } });
          setIsFavorite(false);
        } else {
          await axios.post(`http://localhost:8080/api/favorites`, { user_id: currentUser._id, post_id: postId });
          setIsFavorite(true);
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái yêu thích:", error);
        alert("Đã xảy ra lỗi khi cập nhật yêu thích.");
      }
    },
    [currentUser]
  );

  const toggleCardFavorite = (id: number) => {
    setCardFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const textarea = form.elements.namedItem("comment") as HTMLTextAreaElement;
    const text = textarea.value.trim();
    if (!text) return;
    const newComment: Comment = {
      id: Date.now(),
      user: { name: "User Mới", avatar: "https://placehold.co/40x40/94a3b8/ffffff?text=U" },
      text,
      time: "vừa xong",
      likes: 0,
      replies: [],
    };
    setComments((prev) => [newComment, ...prev]);
    textarea.value = "";
  };

  const price = formatCurrency(postData.post.price);

  const getRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const then = new Date(isoString);
      const diff = now.getTime() - then.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} ngày trước`;
      if (hours > 0) return `${hours} giờ trước`;
      if (minutes > 0) return `${minutes} phút trước`;
      return "vừa xong";
    } catch {
      return "N/A";
    }
  };

  const handleCreateConversation = async () => {
    try {
      const payload = {
        post_id: postData.post._id,
        participants: [currentUser._id, postData.user._id],
      };
      const res = await axios.post("http://localhost:8080/api/conversations", payload);
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
          { _id: currentUser._id, full_name: currentUser.full_name, avatar: currentUser.avatar || "" },
          { _id: postData.user._id, full_name: postData.user.full_name, avatar: postData.user.avatar || "" },
        ],
      };
      localStorage.setItem("conversation", JSON.stringify(conversationToSave));
      router.push(`/conversation/${res.data._id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const extractStringAfterLastComma = (fullString: string): string => {
    if (!fullString || typeof fullString !== "string") return "";
    const lastCommaIndex = fullString.lastIndexOf(",");
    if (lastCommaIndex === -1) return "";
    return fullString.slice(lastCommaIndex + 1).trim();
  };

  return (
    <div className={`${styles["detail-post"]}`}>
      <div className={`${styles["container"]}`}>
        {isLoading ? (
          <LoadingSkeleton />
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

                <ImageGallery
                  images={postData.post.image_urls}
                  currentImageIndex={currentImageIndex}
                  onNavigateImage={navigateImage}
                  onSetImage={handleSetImage}
                  onOpenLightbox={openLightbox}
                  thumbsRef={thumbsRef}
                />

                <PostInfo
                  price={price}
                  transactionType={postData.post.transaction_type}
                  status={postData.post.status}
                  condition={postData.post.condition}
                  views={postData.post.views}
                  createdAt={postData.post.updatedAt}
                  getRelativeTime={getRelativeTime}
                />

                <PostDescription
                  description={postData.post.description}
                  isExpanded={isDescExpanded}
                  onToggleExpanded={() => setIsDescExpanded((v) => !v)}
                  descRef={descRef}
                />

                <CommentSection
                  comments={comments}
                  userAvatar={postData.user.avatar}
                  onSubmitComment={handleSubmitComment}
                  createRipple={createRipple}
                  isLoading={false}
                />
              </div>

              <aside className={`${styles["right-col"]}`}>
                <div className={`${styles["desktop-sticky-sidebar"]}`}>
                  <SellerCard user={postData.user} createRipple={createRipple} />

                  <div className={`${styles["spacer-sm"]}`} />

                  <CTAButtons
                    postId={postData.post._id}
                    postTitle={postData.post.title}
                    transactionType={postData.post.transaction_type}
                    status={postData.post.status}
                    isAuthor={postData.post.author_id === currentUser?._id}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                    onCreateConversation={handleCreateConversation}
                    createRipple={createRipple}
                    postData={postData}
                  />

                  <div className={`${styles["spacer-sm"]}`} />

                  <LocationCard addressText={postData.location.address_text} />
                </div>
              </aside>
            </article>

            <SimilarProducts
              products={postData.similar_products}
              cardFavorites={cardFavorites}
              onToggleCardFavorite={toggleCardFavorite}
              createRipple={createRipple}
              formatCurrency={formatCurrency}
            />
          </div>
        )}

        <Lightbox
          isOpen={isLightboxOpen}
          imageUrl={postData.post.image_urls[currentImageIndex]?.url || ""}
          onClose={closeLightbox}
          onNavigate={navigateImage}
        />

        <MobileFooter
          postId={postData.post._id}
          postTitle={postData.post.title}
          transactionType={postData.post.transaction_type}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onCreateConversation={handleCreateConversation}
          postData={postData}
        />
      </div>
    </div>
  );
};

export default DetailPost;
