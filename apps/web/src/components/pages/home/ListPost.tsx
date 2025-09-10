import stylePostList from "@/styles/pages/home/postList.module.scss";
import axios from "axios";
import { handler } from "next/dist/build/templates/app-page";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ListPost() {

  interface Post {
  _id: string;
  title: string;
  // images: { url: string }[];
  image?: string;
  price: number;
  transaction_type: string;
  // location: { address: string };
  address: string;
  author_id: { full_name: string; avatar: string };
  createdAt: string;
  reputation?: { average_score: number; total_ratings: number };
  condition: string;
  category_id: { name: string };
  stats?: { view_count: number; favorite_count: number };
  distance_km?: number;
  status: string;
}

 const [postsData, setPostsData] = useState<Post[]>([]);

useEffect(() => {
        async function fetchPosts() {
            const res = await axios.get("http://localhost:8080/api/posts/postmap");
            setPostsData(res.data); // res.data là danh sách posts
            console.log("posts", res.data);
        }
        fetchPosts();
        }, []);

console.log("postsData", postsData);
  const posts = [
    {
      _id: "post1",
      title:
        "Ghế sofa đơn phong cách vintage còn rất mới, vải nỉ mềm, không rách",
      images: [{ url: "https://placehold.co/400x300/8c8c8c/ffffff?text=Sofa" }],
      price: 1500000,
      transaction_type: "sell",
      location: { address: "Quận 1, TP. HCM" },
      author: { full_name: "Minh Anh", avatar_url: "https://placehold.co/50" },
      created_at: "2025-08-31T20:00:00Z",
      reputation: { average_score: 4.8, total_ratings: 25 },
      condition: "mới",
      category: { name: "Nội thất" },
      stats: { view_count: 120, favorite_count: 5 },
      distance_km: 0.8,
    },
    {
      _id: "post2",
      title: "Bộ sách học Tiếng Anh IELTS trọn bộ 4 cuốn, kèm file nghe",
      images: [
        { url: "https://placehold.co/400x300/6A6A6A/ffffff?text=S%C3%A1ch" },
      ],
      price: null,
      transaction_type: "exchange",
      location: { address: "Quận 3, TP. HCM" },
      author: { full_name: "Tuấn Nam", avatar_url: "https://placehold.co/50" },
      created_at: "2025-08-31T15:30:00Z",
      reputation: { average_score: 4.5, total_ratings: 12 },
      condition: "đã sử dụng",
      category: { name: "Sách & Văn phòng" },
      stats: { view_count: 85, favorite_count: 2 },
      distance_km: 3.2,
    },
    {
      _id: "post3",
      title: "Thanh lý áo phông oversize mới mặc 1 lần, không còn nhu cầu",
      images: [
        { url: "https://placehold.co/400x300/3A3A3A/ffffff?text=%C3%81o" },
      ],
      price: 80000,
      transaction_type: "sell",
      location: { address: "Thủ Đức, TP. HCM" },
      author: { full_name: "Ngọc Hân", avatar_url: "https://placehold.co/50" },
      created_at: "2025-08-29T12:00:00Z",
      reputation: { average_score: 4.9, total_ratings: 30 },
      condition: "như mới",
      category: { name: "Thời trang" },
      stats: { view_count: 250, favorite_count: 15 },
      distance_km: 12.4,
    },
    {
      _id: "post4",
      title:
        "Cho tặng chậu cây xương rồng, chăm sóc dễ, thích hợp để bàn làm việc",
      images: [
        { url: "https://placehold.co/400x300/AAAAAA/ffffff?text=C%C3%A2y" },
      ],
      price: null,
      transaction_type: "giveaway",
      location: { address: "Quận 7, TP. HCM" },
      author: { full_name: "Bảo Trân", avatar_url: "https://placehold.co/50" },
      created_at: "2025-08-28T09:00:00Z",
      reputation: { average_score: 5.0, total_ratings: 5 },
      condition: "đã sử dụng",
      category: { name: "Cây cảnh & Vật nuôi" },
      stats: { view_count: 50, favorite_count: 1 },
      distance_km: 0.5,
    },
  ];

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

  const formatDistance = (distance_km?: number) => {
    if (distance_km == null) return "-";
    if (distance_km < 1) {
      const meters = Math.round(distance_km * 1000);
      return `${meters} m`;
    }
    return `${distance_km.toFixed(1)} km`;
  };

  return (
    <div className={stylePostList.container}>
      {postsData.map((post) => {
        const isSell = post.transaction_type === "sell";
        let priceHtml;
        if (isSell) {
          // Format number with Vietnamese separators and append ' VNĐ' instead of the currency symbol
          priceHtml = (
            <span className={stylePostList.postPrice}>
              {`${new Intl.NumberFormat("vi-VN").format(post.price!)} VNĐ`}
            </span>
          );
        } else {
          const typeText =
            post.transaction_type === "exchange" ? "Trao đổi" : "Cho tặng";
          priceHtml = (
            <span className={stylePostList.postPrice}>{typeText}</span>
          );
        }

        return (
          <a
            key={post._id}
            href="#"
            className={stylePostList.postCard}
            title={post.title}
          >
            <div className={stylePostList.postImage}>
              <Image
                // src={post.images[0].url}
                src={post.image ? process.env.NEXT_PUBLIC_URL_GCS + post.image : "/image/post/default.png"}
                alt={post.title}
                fill
                className={stylePostList.imageItem}
              />
              <button
                type="button"
                aria-label="Yêu thích bài đăng"
                title="Yêu thích bài đăng"
                className={stylePostList.favoriteButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  /* TODO: toggle favorite state */
                }}
              >
                {/* Inline SVG so we can change its internal fill on hover via CSS */}
                <svg
                  className={stylePostList.favoriteIcon}
                  viewBox="0 0 18 17"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M13.0547 1.5C13.5707 1.49541 14.0838 1.59625 14.5625 1.79688C15.0409 1.99743 15.4781 2.29535 15.8467 2.67285C16.1688 3.003 16.433 3.38859 16.627 3.8125L16.7061 3.99707C16.9044 4.49399 17.0046 5.02804 17 5.56641C16.9954 6.10448 16.8856 6.63556 16.6787 7.12891C16.4737 7.61785 16.176 8.05913 15.8047 8.42871L15.7998 8.43457L15.7949 8.43945L8.97363 15.4277L2.15332 8.44043C1.41748 7.68641 1.00008 6.65831 1 5.58203L1.00488 5.38086C1.05349 4.37864 1.46268 3.43055 2.15234 2.72363L2.15332 2.72461C2.88902 1.97129 3.88148 1.55179 4.91016 1.55176C5.93918 1.55177 6.9316 1.97066 7.66699 2.72363L8.25879 3.33008L8.97363 4.0625L9.68945 3.33008L10.2822 2.72363L10.293 2.71289C10.6534 2.33317 11.0823 2.03169 11.5537 1.82422C12.0292 1.61509 12.5392 1.50464 13.0547 1.5Z"
                    stroke="white"
                    strokeWidth={2}
                    fill="none"
                  />
                </svg>
              </button>
            </div>
            <div className={stylePostList.postContent}>
              <div className={stylePostList.cardHeader}>
                <h3 className={stylePostList.postTitle}>{post.title}</h3>
                <span className={stylePostList.conditionBadge}>
                  {post.condition}
                </span>
              </div>
              {priceHtml}
              <div className={stylePostList.postDetails}>
                <p>
                  {/* <strong>Tình trạng:</strong> {post.category.name} */}
                   <strong>Danh mục:</strong> {post.category_id.name}
                </p>
                <p>
                  {/* <strong>Vị trí:</strong> {post.location.address} */}
                   <strong>Vị trí:</strong> {post.address}
                </p>
                <div className={stylePostList.location}>
                  <Image
                    src="image/post/location.svg"
                    alt="Vị trí"
                    width={15}
                    height={15}
                  />
                  <p style={{ fontSize: "15px", color: "#888" }}>
                    {formatDistance(post.distance_km)}
                  </p>
                </div>
              </div>
              <div className={stylePostList.postMeta}>
                <div className={stylePostList.authorInfo}>
                  <Image
                    src={process.env.NEXT_PUBLIC_URL_GCS + post.author_id.avatar}
                    alt={post.author_id.full_name}
                    width={35}
                    height={35}
                  />
                  <span className={stylePostList.authorName}>
                    {post.author_id.full_name}
                  </span>
                </div>
                <span className={stylePostList.rating}>
                  ⭐ {post.reputation ? post.reputation.average_score.toFixed(1) : "-"}
                </span>
              </div> 
               <div className={stylePostList.postStats}>
                <span>Lượt xem: {post.stats?.view_count ?? "-"}</span>
                <span>Yêu thích: {post.stats?.favorite_count ?? "-"}</span>
                <span className={stylePostList.time}>
                  {getRelativeTime(post.createdAt)}
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
