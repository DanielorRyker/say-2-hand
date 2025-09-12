"use client";
import styleAdmin from "@/styles/pages/admin/admin.module.scss";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Home = () => {
  const router = useRouter();

 const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // chỉ chạy ở client, không bị lỗi
    const storedToken = localStorage.getItem("access_token");
    setToken(storedToken);
  }, []);
  //lấy dữ liệu
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
      setUsersData(res.data); // res.data là danh sách user
      console.log("users", res.data);
    }
    fetchUsers();
  }, []);

  // Phân trang
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(usersData.length / pageSize);
  const paginatedUsers = usersData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  //xóa user
  const handleDeleteUser = async (userId: string) => {
    const ok = window.confirm("Bạn có chắc chắn muốn xóa user này không?");
   
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:8080/api/users/${userId}`,{
        headers: {
        Authorization: `Bearer ${token}`,
      },
      });
      setUsersData(usersData.filter((user) => user._id !== userId));
      alert("Xóa thành công");
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert("Phiên của bạn đã kết thúc, vui lòng đăng nhập lại !");
        localStorage.clear();
        router.push("/auth/login");
      }
      else{
        console.error("Error deleting user:", error);
      alert("Có lỗi xảy ra khi xóa user");
      }
      
    }
  };
  //chỉnh sửa user
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const handleEdit = (user: User) => {
    setEditingUserId(user._id);
    setEditForm(user);
  };

  const handleFieldChange = (field: keyof User, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!editingUserId) return;
    try {
      await axios.patch("http://localhost:8080/api/users", {
        _id: editingUserId,
        ...editForm,
      });
      setUsersData(
        usersData.map((u) =>
          u._id === editingUserId ? { ...u, ...editForm } : u
        )
      );
      setEditingUserId(null);
      alert("Cập nhật thành công");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Có lỗi khi cập nhật user");
    }
  };

  const userFields: (keyof User)[] = [
    "email",
    "full_name",
    "role",
    "status",
    "avatar",
    "description",
    "phone_number",
    "address",
  ];
  return (
    <div className={styleAdmin.container}>
      <h2>Danh sách người dùng</h2>
      <table style={{ borderCollapse: "collapse", width: "90%" }}>
        <thead>
          <tr>
            <th className={styleAdmin.tbheader}>#</th>
            <th className={styleAdmin.tbheader}>Email</th>
            <th className={styleAdmin.tbheader}>Name</th>
            <th className={styleAdmin.tbheader}>Role</th>
            <th className={styleAdmin.tbheader}>Status</th>
            <th className={styleAdmin.tbheader}>Avatar</th>
            <th className={styleAdmin.tbheader}>Description</th>
            <th className={styleAdmin.tbheader}>Phone Number</th>
            <th className={styleAdmin.tbheader}>Address</th>
            <th className={styleAdmin.tbheader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((user, idx) => (
            <tr key={user._id}>
              <td className={styleAdmin.tbrow}>
                {(currentPage - 1) * pageSize + idx + 1}
              </td>

              {userFields.map((field) => (
                <td key={field} className={styleAdmin.tbrow}>
                  {editingUserId === user._id ? (
                    <input
                      className={styleAdmin.tableInput}
                      value={editForm[field] || ""}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                    />
                  ) : (
                    user[field] || ""
                  )}
                </td>
              ))}

              <td className={styleAdmin.tbrow}>
                {user.role === "admin" ? (
                  <>
                    <button
                      className={styleAdmin.btnEdit}
                      disabled
                      style={{ opacity: 0.5 }}
                    >
                      Edit
                    </button>
                    <button
                      className={styleAdmin.btnRemove}
                      disabled
                      style={{ opacity: 0.5 }}
                    >
                      Remove
                    </button>
                  </>
                ) : editingUserId === user._id ? (
                  <>
                    <button className={styleAdmin.btnEdit} onClick={handleSave}>
                      Save
                    </button>
                    <button
                      className={styleAdmin.btnEdit}
                      onClick={() => {
                        setEditingUserId(null);
                        setEditForm({});
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styleAdmin.btnEdit}
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className={styleAdmin.btnRemove}
                      onClick={() => handleDeleteUser(user._id)}
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
