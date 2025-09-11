"use client";
import styleAdmin from "@/styles/pages/admin/admin.module.scss";
import axios from "axios";
import { useState, useEffect } from "react";

const Home = () => {
  //lấy dữ liệu
  interface Post {
    _id: string;
    title?: string;
    author_id?: string;
    category_id?: string;
    description?: string;
    price?: number;
    condition?: string;
    address?: string;
    status?: string;
    createdAt?: number;
    updatedAt?: number;
  }

  const [postsData, setPostsData] = useState<Post[]>([]);

  useEffect(() => {
    async function fetchPosts() {
      const res = await axios.get("http://localhost:8080/api/posts/");
      setPostsData(res.data); // res.data là danh sách posts
    }
    fetchPosts();
  }, []);

  //lấy user
  interface User {
    _id: string;
    email?: string;
    full_name?: string;
    role?: string;
    status?: string;
    phone_number?: string;
    address?: string;
    description?: string;
    avatar?: string;
  }

  const [usersData, setUsersData] = useState<User[]>([]);
  useEffect(() => {
    async function fetchUsers() {
      const res = await axios.get("http://localhost:8080/api/users/");
      setUsersData(res.data); // res.data là danh sách users
    }
    fetchUsers();
  }, []);

  const getAuthorName = (author_id: string) => {
    const user = usersData.find((u) => u._id === author_id);
    return user ? user.full_name : author_id;
  };

  // Lấy tên danh mục
  interface Category {
    _id: string;
    name?: string;
    slug?: string;
    image?: string;
  }

  const [categoriesData, setCategoriesData] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const res = await axios.get("http://localhost:8080/api/categories/");
      setCategoriesData(res.data); // res.data là danh sách categories
    }
    fetchCategories();
  }, []);

  const getCategoryName = (category_id: string) => {
    const category = categoriesData.find((c) => c._id === category_id);
    return category ? category.name : category_id;
  };

  // Phân trang
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(postsData.length / pageSize);
  const paginatedPosts = postsData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Sort và filter
  const handleSortByNewest = async () => {
    const res = await axios.get("http://localhost:8080/api/posts");
    setPostsData(res.data);
    setCurrentPage(1); // reset về trang 1
  };

  const handleSortByOldest = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/oldest");
    setPostsData(res.data);
    setCurrentPage(1);
  };

  const handleFilterByPending = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/pending");
    setPostsData(res.data);
    setCurrentPage(1);
  };

  const handleFilterByActive = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/active");
    setPostsData(res.data);
    setCurrentPage(1);
  };

  const handleFilterByRejected = async () => {
    const res = await axios.get("http://localhost:8080/api/posts/rejected");
    setPostsData(res.data);
    setCurrentPage(1);
  };

  // Xử lý xóa bài đăng
  //1.Chấp thuận
  const handleActivePost = async (postId: string) => {
    await axios.patch(`http://localhost:8080/api/posts/${postId}`, {
      status: "active",
    });
    setPostsData(
      postsData.map((post) =>
        post._id === postId ? { ...post, status: "active" } : post
      )
    );
  };
  //2.Từ chối
  const handleRejectPost = async (postId: string) => {
    await axios.patch(`http://localhost:8080/api/posts/${postId}`, {
      status: "rejected",
    });
    setPostsData(
      postsData.map((post) =>
        post._id === postId ? { ...post, status: "rejected" } : post
      )
    );
  };
  //3.Xóa
  const handleDeletePost = async (postId: string) => {
    await axios.delete(`http://localhost:8080/api/posts/${postId}`);
    setPostsData(postsData.filter((post) => post._id !== postId));
  };
  return (
    <div className={styleAdmin.container}>
      <h2>Danh sách các bài đăng</h2>
      <div className={styleAdmin.cardSort}>
        <label>Xắp xếp theo :</label>
        <button onClick={handleSortByNewest} className={styleAdmin.btnSort}>
          Mới nhất
        </button>
        <button onClick={handleSortByOldest} className={styleAdmin.btnSort}>
          Cũ nhất
        </button>
        <button onClick={handleFilterByPending} className={styleAdmin.btnSort}>
          Chờ duyệt
        </button>
        <button onClick={handleFilterByActive} className={styleAdmin.btnSort}>
          Đã duyệt
        </button>
        <button onClick={handleFilterByRejected} className={styleAdmin.btnSort}>
          Từ chối
        </button>
      </div>
      <table style={{ borderCollapse: "collapse", width: "90%" }}>
        <thead>
          <tr>
            <th className={styleAdmin.tbheader}>#</th>
            <th className={styleAdmin.tbheader}>Title</th>
            <th className={styleAdmin.tbheader}>Author</th>
            <th className={styleAdmin.tbheader}>Category</th>
            <th className={styleAdmin.tbheader}>Description</th>
            <th className={styleAdmin.tbheader}>Price</th>
            <th className={styleAdmin.tbheader}>Condition</th>
            <th className={styleAdmin.tbheader}>Address</th>
            <th className={styleAdmin.tbheader}>Status</th>
            <th className={styleAdmin.tbheader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedPosts.map((post, idx) => (
            <tr key={post._id}>
              <td className={styleAdmin.tbrow}>
                {(currentPage - 1) * pageSize + idx + 1}
              </td>
              <td className={styleAdmin.tbrow}>{post.title}</td>
              <td className={styleAdmin.tbrow}>
                {getAuthorName(post.author_id ?? "")}
              </td>
              <td className={styleAdmin.tbrow}>
                {getCategoryName(post.category_id ?? "")}
              </td>
              <td className={styleAdmin.tbrow}>{post.description}</td>
              <td className={styleAdmin.tbrow}>{post.price}</td>
              <td className={styleAdmin.tbrow}>{post.condition}</td>
              <td className={styleAdmin.tbrow}>{post.address}</td>
              <td className={styleAdmin.tbrow}>{post.status}</td>
              <td className={styleAdmin.tbrow}>
                {post.status === "active" || post.status === "rejected" ? (
                  <>
                    <button
                      className={styleAdmin.btnEdit}
                      style={{ opacity: 0.5 }}
                      disabled
                    >
                      Active
                    </button>
                    <button
                      className={styleAdmin.btnEdit}
                      style={{ opacity: 0.5 }}
                      disabled
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className={styleAdmin.btnRemove}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleActivePost(post._id)}
                      className={styleAdmin.btnEdit}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleRejectPost(post._id)}
                      className={styleAdmin.btnEdit}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className={styleAdmin.btnRemove}
                    >
                      Remove
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Phân trang */}
      {totalPages > 1 && (
        <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ fontSize: "12px", padding: "2px 8px" }}
          >
            Trang trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                fontWeight: currentPage === i + 1 ? "bold" : "normal",
                fontSize: "12px",
                padding: "2px 8px",
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{ fontSize: "12px", padding: "2px 8px" }}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};
export default Home;
