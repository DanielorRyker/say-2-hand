"use client";
import styleAdmin from "@/styles/pages/admin/admin.module.scss";
import axios from "axios";
import { useState, useEffect } from "react";

const Home = () =>{
    //lấy dữ liệu
        interface Post {
            _id: string;
            title?: string;
            author?: string;
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
        // Phân trang
                const pageSize = 10;
                const [currentPage, setCurrentPage] = useState(1);
                const totalPages = Math.ceil(postsData.length / pageSize);
                const paginatedPosts = postsData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        //Sort và filter
        const handleSortByNewest = async () => {
            const res = await axios.get("http://localhost:8080/api/posts");
            setPostsData(res.data);
        };
        const handleSortByOldest = async () => {
            const res = await axios.get("http://localhost:8080/api/posts/oldest");
            setPostsData(res.data);
        };
         const handleFilterByPending = async () => {
            const res = await axios.get("http://localhost:8080/api/posts/pending");
            setPostsData(res.data);
        };
         const handleFilterByActive = async () => {
            const res = await axios.get("http://localhost:8080/api/posts/active");
            setPostsData(res.data);
        };
         const handleFilterByRejected = async () => {
            const res = await axios.get("http://localhost:8080/api/posts/rejected");
            setPostsData(res.data);
        };
        
        return (
        <div className={styleAdmin.container}>
             <h2>Danh sách các bài đăng</h2>
             <div className={styleAdmin.cardSort}>
                <label>Xắp xếp theo :</label>
                <button onClick={handleSortByNewest} className={styleAdmin.btnSort}>Mới nhất</button>
                <button onClick={handleSortByOldest} className={styleAdmin.btnSort}>Cũ nhất</button>
                <button onClick={handleFilterByPending} className={styleAdmin.btnSort}>Chờ duyệt</button>
                <button onClick={handleFilterByActive} className={styleAdmin.btnSort}>Đã duyệt</button>
                <button onClick={handleFilterByRejected} className={styleAdmin.btnSort}>Từ chối</button>
             </div>
             <table style={{ borderCollapse: "collapse" , width: "90%"}}>
                <thead>
                        <tr>
                            <th className={styleAdmin.tbheader}>#</th>
                            <th className={styleAdmin.tbheader}>Title</th>                      
                            <th className={styleAdmin.tbheader}>Author</th>
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
                        <td className={styleAdmin.tbrow}>{(currentPage - 1) * pageSize + idx + 1}</td>
                                <td className={styleAdmin.tbrow}>{post.title}</td>
                                <td className={styleAdmin.tbrow}>{post.author}</td>
                                <td className={styleAdmin.tbrow}>{post.description}</td>
                                <td className={styleAdmin.tbrow}>{post.price}</td>
                                <td className={styleAdmin.tbrow}>{post.condition}</td>
                                <td className={styleAdmin.tbrow}>{post.address}</td>
                                <td className={styleAdmin.tbrow}>{post.status}</td>
                                <td className={styleAdmin.tbrow}>
                                    {/* <button className={styleAdmin.btnEdit} onClick={() => handleEdit(post)}>Edit</button>
                                    <button className={styleAdmin.btnRemove} onClick={() => handleDeletePost(post._id)}>Remove</button> */}
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
                                style={{ fontWeight: currentPage === i + 1 ? "bold" : "normal", fontSize: "12px", padding: "2px 8px" }}
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