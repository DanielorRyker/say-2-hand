import stylePostList from "@/styles/pages/home/postList.module.scss";
import Image from "next/image";
export default function ListPost() {
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
      condition: "new",
      category: { name: "Nội thất" },
      stats: { view_count: 120, favorite_count: 5 },
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
      condition: "used",
      category: { name: "Sách & Văn phòng" },
      stats: { view_count: 85, favorite_count: 2 },
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
      condition: "like_new",
      category: { name: "Thời trang" },
      stats: { view_count: 250, favorite_count: 15 },
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
      condition: "used",
      category: { name: "Cây cảnh & Vật nuôi" },
      stats: { view_count: 50, favorite_count: 1 },
    },
  ];
  return (
    <div className={stylePostList.container}>
      {posts.map((post, index) => (
        <button key={post._id}>
          <div className={stylePostList.imageList}>
            <Image
              src={post.images[0].url}
              alt={post.title}
              fill
              className={stylePostList.imageItem}
            />
          </div>

          <h3>{post.title}</h3>
          <p>{post.price ? `${post.price} VND` : "Miễn phí"}</p>
        </button>
      ))}
      ;
    </div>
  );
}
