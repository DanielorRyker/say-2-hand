"use client";
import styleAdmin from "@/styles/pages/admin/admin.module.scss";
import axios from "axios";
import { useEffect, useState } from "react";

const Home = () =>{

    interface User {
        email?: string;
        full_name?: string;
        role?: string;
        status?: string;
    }
    const [usersData, setUsersData] = useState<User[]>([]);

        useEffect(() => {
        async function fetchUsers() {
            const res = await axios.get("http://localhost:8080/api/users/");
            setUsersData(res.data); // res.data là danh sách user
            console.log("users", res.data);
        }
        fetchUsers();
        }, []);

        // Dữ liệu mẫu, bạn có thể thay bằng dữ liệu thực tế từ API
        const usersTest = [
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
            { email: "user1@example.com", name: "User One", role: "user", status: "active" },
            { email: "admin@example.com", name: "Admin", role: "admin", status: "inactive" },
            { email: "user2@example.com", name: "User Two", role: "user", status: "active" },
        ];

        // Phân trang
        const pageSize = 10;
        const [currentPage, setCurrentPage] = useState(1);
        const totalPages = Math.ceil(usersData.length / pageSize);
        const paginatedUsers = usersData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        return (
            <div className={styleAdmin.container}>
                <h2>Danh sách người dùng</h2>
                <table style={{ borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ccc", padding: "1px 2px"}}>Email</th>
                            <th style={{ border: "1px solid #ccc", padding: "1px 2px"}}>Name</th>
                            <th style={{ border: "1px solid #ccc", padding: "1px 2px" }}>Role</th>
                            <th style={{ border: "1px solid #ccc", padding: "1px 2px"}}>Status</th>
                            <th style={{ border: "1px solid #ccc", padding: "1px 2px"}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map((user, idx) => (
                            <tr key={idx}>
                                <td style={{ border: "1px solid #ccc", padding: "1px 2px" }}>{user.email|| ""}</td>
                                <td style={{ border: "1px solid #ccc", padding: "1px 2px" }}>{user.full_name|| ""}</td>
                                <td style={{ border: "1px solid #ccc", padding: "1px 2px" }}>{user.role|| ""}</td>
                                <td style={{ border: "1px solid #ccc", padding: "1px 2px"}}>{user.status|| ""}</td>
                                <td style={{ border: "1px solid #ccc", padding: "1px 2px" }}>
                                    <button style={{ marginRight: "8px", padding: "1px 4px" }}>Edit</button>
                                    <button style={{ color: "red", padding: "1px 4px" }}>Remove</button>
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