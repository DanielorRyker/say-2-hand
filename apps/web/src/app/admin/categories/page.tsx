"use client";
import styleAdmin from "@/styles/pages/admin/admin.module.scss";
import axios from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import { URL_GCS } from "@/lib/constants";

const Home = () => {
  const bucket = "categories";

  //lấy dữ liệu
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

  // Phân trang
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(categoriesData.length / pageSize);
  const paginatedCategories = categoriesData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  //chỉnh sửa category
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editForm, setEditForm] = useState<Partial<Category>>({});

  const handleEdit = (category: Category) => {
    setEditingCategoryId(category._id);
    setEditForm(category);
  };

  const handleFieldChange = (field: keyof Category, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }; //xóa category
  const handleDeleteCategory = async (categoryId: string) => {
    const ok = window.confirm("Bạn có chắc chắn muốn xóa category này không?");
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:8080/api/categories/${categoryId}`);
      setCategoriesData(
        categoriesData.filter((category) => category._id !== categoryId)
      );
      alert("Xóa thành công");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Có lỗi xảy ra khi xóa category");
    }
  };

  const handleSave = async () => {
    if (!editingCategoryId) return;
    try {
      let imageUrl = editForm.image;
      if (file) {
        // Nếu có file mới, upload và lấy tên file
        const uploaded = await uploadImage(file);
        imageUrl = uploaded === null ? undefined : uploaded;
      }
      await axios.patch("http://localhost:8080/api/categories", {
        _id: editingCategoryId,
        ...editForm,
        image: imageUrl,
      });
      setCategoriesData(
        categoriesData.map((c) =>
          c._id === editingCategoryId
            ? { ...c, ...editForm, image: imageUrl }
            : c
        )
      );
      setEditingCategoryId(null);
      setFile(null);
      setPreview(null);
      alert("Cập nhật thành công");
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Có lỗi khi cập nhật category");
    }
  };

  const categoryFields: (keyof Category)[] = ["name", "slug"];

  // State cho input thêm danh mục mới
  const [newCategoryName, setNewCategoryName] = useState("");

  //Thêm ảnh
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  // Hàm upload ảnh, trả về tên file ảnh
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) {
      alert("Vui lòng chọn ảnh!");
      return null;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      const res = await axios.post(
        "http://localhost:8080/api/upload/img",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data.filename;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Có lỗi khi tải ảnh lên");
      return null;
    }
  };

  // Hàm thêm danh mục mới
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    } else if (!file) return alert("Vui lòng chọn ảnh!");

    const ok = window.confirm(
      `Bạn có chắc chắn muốn thêm danh mục: ${newCategoryName}?`
    );
    if (!ok) return;
    try {
      const formData = new FormData();
      formData.append("file", file);

      const img = await uploadImage(file);

      await axios.post("http://localhost:8080/api/categories", {
        name: newCategoryName,
        image: img,
      });
      // Sau khi thêm, gọi lại API để lấy danh sách mới nhất
      const res = await axios.get("http://localhost:8080/api/categories/");
      setCategoriesData(res.data);
      setNewCategoryName("");
      alert("Thêm danh mục thành công!");
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Có lỗi khi thêm danh mục!");
    }
  };

  const imageLoader = ({ src }: { src: string }) => {
    if (!src) return "/image/category/default.svg";
    if (src.startsWith("http") || src.startsWith("/")) return src;
    if (URL_GCS) return URL_GCS + src;
    return src;
  };

  return (
    <div className={styleAdmin.container}>
      <h2>Danh sách các danh mục</h2>
      <div className={styleAdmin.cardAddCategory}>
        <label htmlFor="">Thêm danh mục :</label>
        <input
          className={styleAdmin.inputAdd}
          type="text"
          placeholder="Nhập tên danh mục"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        {/* Chọn ảnh */}
        {preview ? (
          <div>
            <input
              type="file"
              accept="image/*"
              id="upload-avatar"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label htmlFor="upload-avatar">
              <Image
                loader={imageLoader}
                src={preview ?? "/image/category/default.svg"}
                alt="preview"
                width={80}
                height={80}
                className={styleAdmin.imgCategory}
                unoptimized
              />
            </label>
          </div>
        ) : (
          <div className={styleAdmin.imgCategory}>
            <input
              type="file"
              accept="image/*"
              id="upload-avatar"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label htmlFor="upload-avatar">
              <Image
                loader={imageLoader}
                src="/image/profile/camera.svg"
                alt="Upload avatar"
                width={80}
                height={80}
                className={styleAdmin.imgCategory}
                unoptimized
              />
            </label>
          </div>
        )}
        <button className={styleAdmin.btnAdd} onClick={handleAddCategory}>
          Thêm
        </button>
      </div>
      <table style={{ borderCollapse: "collapse", width: "90%" }}>
        <thead>
          <tr>
            <th className={styleAdmin.tbheader}>#</th>
            <th className={styleAdmin.tbheader}>Name</th>
            <th className={styleAdmin.tbheader}>Slug</th>
            <th className={styleAdmin.tbheader}>Image</th>
            <th className={styleAdmin.tbheader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCategories.map((category, idx) => (
            <tr key={category._id}>
              <td className={styleAdmin.tbrow}>
                {(currentPage - 1) * pageSize + idx + 1}
              </td>

              {categoryFields.map((field) => (
                <td key={field} className={styleAdmin.tbrow}>
                  {editingCategoryId === category._id ? (
                    <input
                      className={styleAdmin.tableInput}
                      value={editForm[field] || ""}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                    />
                  ) : (
                    category[field] || ""
                  )}
                </td>
              ))}
              <td className={styleAdmin.tbrow}>
                {editingCategoryId === category._id ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ width: "100%" }}
                    />
                    {preview && (
                      <Image
                        loader={imageLoader}
                        src={preview}
                        alt="preview"
                        width={80}
                        height={80}
                        className={styleAdmin.imgCategory}
                        unoptimized
                      />
                    )}
                  </>
                ) : category.image ? (
                  // Ensure correct image URL
                  <Image
                    loader={imageLoader}
                    src={category.image ?? "/image/category/default.svg"}
                    alt="category"
                    width={80}
                    height={80}
                    className={styleAdmin.imgCategory}
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/image/profile/camera.svg";
                    }}
                    unoptimized
                  />
                ) : (
                  <Image
                    loader={imageLoader}
                    src="/image/category/default.svg"
                    alt="No image"
                    width={80}
                    height={80}
                    className={styleAdmin.imgCategory}
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                )}
              </td>

              <td className={styleAdmin.tbrow}>
                {editingCategoryId === category._id ? (
                  <>
                    <button className={styleAdmin.btnEdit} onClick={handleSave}>
                      Save
                    </button>
                    <button
                      className={styleAdmin.btnEdit}
                      onClick={() => {
                        setEditingCategoryId(null);
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
                      onClick={() => handleEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      className={styleAdmin.btnRemove}
                      onClick={() => handleDeleteCategory(category._id)}
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
