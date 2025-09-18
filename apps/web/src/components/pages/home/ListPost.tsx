import stylePostList from "@/styles/pages/home/postList.module.scss";
import axios from "axios";
import { handler } from "next/dist/build/templates/app-page";
import Image from "next/image";
import { useEffect, useState } from "react";
import { API_BASE, URL_GCS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function ListPost() {
   const router = useRouter();
   
  interface Post {
    _id: string;
    title: string;
    // images: { url: string }[];
    image?: string;
    price: number;
    transaction_type: string;
    // location: { address: string };
    address: string;
    author_id: {_id:string; full_name: string; avatar: string };
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
      const res = await axios.get(`${API_BASE}/api/posts/postmap`);
      setPostsData(res.data); // res.data là danh sách posts
      console.log("posts", res.data);
    }
    fetchPosts();
  }, []);

const handlerTest = (post: Post) => {
  localStorage.setItem("post", JSON.stringify(post));
  router.push(`/post/${post._id}`)
};

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
            // href="#"
            className={stylePostList.postCard}
            title={post.title}
            
             onClick={()=>handlerTest(post)}
          >
            <div className={stylePostList.postImage}>
              <Image
                // src={post.images[0].url}
                src={
                  post.image ? URL_GCS + post.image : "/image/post/default.png"
                }
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
                    src={URL_GCS + post.author_id.avatar}
                    alt={post.author_id.full_name}
                    width={35}
                    height={35}
                  />
                  <span className={stylePostList.authorName}>
                    {post.author_id.full_name}
                  </span>
                </div>
                <span className={stylePostList.rating}>
                  ⭐{" "}
                  {post.reputation
                    ? post.reputation.average_score.toFixed(1)
                    : "-"}
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
