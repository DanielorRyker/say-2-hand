"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Table } from "@/components/admin/Table";
import { formatImageUrl, URL_GCS } from "@/lib/constants";
import styles from "./categories.module.scss";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  posts_count?: number;
  created_at?: string;
}

interface CategoryForm {
  name: string;
  slug?: string;
  image?: string;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: "",
    slug: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "categories");
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8080/api/upload/img",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.filename;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert("Vui lòng nhập tên danh mục!");
      return;
    }
    try {
      setUploading(true);
      let imageUrl = "";
      if (imageFile) {
        const uploadedImage = await uploadImage(imageFile);
        if (uploadedImage) imageUrl = uploadedImage;
      }
      const slug = categoryForm.slug || generateSlug(categoryForm.name);
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8080/api/categories",
        { name: categoryForm.name, slug, image: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategories();
      setShowAddModal(false);
      setCategoryForm({ name: "", slug: "" });
      setImageFile(null);
      setImagePreview("");
      alert("Thêm danh mục thành công!");
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Có lỗi khi thêm danh mục!");
    } finally {
      setUploading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !categoryForm.name.trim()) return;
    try {
      setUploading(true);
      let imageUrl = selectedCategory.image;
      if (imageFile) {
        const uploadedImage = await uploadImage(imageFile);
        if (uploadedImage) imageUrl = uploadedImage;
      }
      const slug = categoryForm.slug || generateSlug(categoryForm.name);
      const token = localStorage.getItem("token");
      await axios.patch(
        "http://localhost:8080/api/categories",
        {
          _id: selectedCategory._id,
          name: categoryForm.name,
          slug,
          image: imageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategories();
      setShowEditModal(false);
      setSelectedCategory(null);
      setCategoryForm({ name: "", slug: "" });
      setImageFile(null);
      setImagePreview("");
      alert("Cập nhật danh mục thành công!");
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Có lỗi khi cập nhật danh mục!");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa danh mục này?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/api/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCategories();
      alert("Xóa danh mục thành công!");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Có lỗi khi xóa danh mục!");
    }
  };

  const openAddModal = () => {
    setCategoryForm({ name: "", slug: "" });
    setImageFile(null);
    setImagePreview("");
    setShowAddModal(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      image: category.image,
    });
    setImagePreview(formatImageUrl(category.image) || "");
    setShowEditModal(true);
  };

  const openDetailModal = (category: Category) => {
    setSelectedCategory(category);
    setShowDetailModal(true);
  };

  const imageLoader = ({ src }: { src: string }): string => {
    if (!src) return "/image/category/default.svg";
    if (src.startsWith("http") || src.startsWith("/")) return src;
    return formatImageUrl(src) || "/image/category/default.svg";
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: "image" as keyof Category,
      title: "Ảnh",
      render: (image: string | undefined, category: Category) => (
        <div className={styles.imageCell}>
          <Image
            loader={imageLoader}
            src={
              formatImageUrl(image) ||
              formatImageUrl(category.image) ||
              "/image/category/default.svg"
            }
            alt={category?.name || ""}
            width={60}
            height={60}
            className={styles.categoryImage}
            unoptimized
          />
        </div>
      ),
    },
    {
      key: "name" as keyof Category,
      title: "Tên danh mục",
      render: (_value: string, category: Category) => (
        <div className={styles.nameCell}>
          <span className={styles.categoryName}>{category.name}</span>
          <span className={styles.categorySlug}>{category.slug}</span>
        </div>
      ),
    },
    {
      key: "posts_count" as keyof Category,
      title: "Số bài đăng",
      render: (count: number) => (
        <div className={styles.statsCell}>
          <Icon icon="mdi:post-outline" />
          <span>{count || 0}</span>
        </div>
      ),
    },
    {
      key: "_id" as keyof Category,
      title: "Thao tác",
      render: (_: any, category: Category) => (
        <div className={styles.actionButtons}>
          <button
            className={styles.btnEdit}
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(category);
            }}
            title="Chỉnh sửa"
          >
            <Icon icon="mdi:pencil" />
          </button>
          <button
            className={styles.btnDelete}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCategory(category._id);
            }}
            title="Xóa"
          >
            <Icon icon="mdi:delete" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.categoriesPage}>
      <div className={styles.header}>
        <div>
          <h1>Quản lý danh mục</h1>
          <p>Quản lý các danh mục sản phẩm trên hệ thống</p>
        </div>
        <button className={styles.btnAdd} onClick={openAddModal}>
          <Icon icon="mdi:plus" />
          Thêm danh mục
        </button>
      </div>

      <div className={styles.searchBar}>
        <Icon icon="mdi:magnify" />
        <input
          type="text"
          placeholder="Tìm kiếm danh mục..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Table
        data={filteredCategories}
        columns={columns}
        loading={loading}
        onRowClick={openDetailModal}
      />

      {/* Add Category Modal */}
      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Thêm danh mục mới</h2>
              <button
                className={styles.btnClose}
                onClick={() => setShowAddModal(false)}
              >
                <Icon icon="mdi:close" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục"
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCategoryForm({
                      ...categoryForm,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Slug</label>
                <input
                  disabled
                  type="text"
                  placeholder="Slug tự động tạo"
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Ảnh danh mục</label>
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="add-image"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="add-image" className={styles.uploadLabel}>
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={120}
                        height={120}
                        className={styles.previewImage}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <Icon icon="mdi:camera-plus" />
                        <span>Chọn ảnh</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </button>
              <button
                className={styles.btnSubmit}
                onClick={handleAddCategory}
                disabled={uploading}
              >
                {uploading ? "Đang xử lý..." : "Thêm danh mục"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className={styles.modal} onClick={() => setShowEditModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Chỉnh sửa danh mục</h2>
              <button
                className={styles.btnClose}
                onClick={() => setShowEditModal(false)}
              >
                <Icon icon="mdi:close" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  placeholder="Nhập tên danh mục"
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCategoryForm({
                      ...categoryForm,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Slug</label>
                <input
                  type="text"
                  placeholder="Slug tự động tạo"
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Ảnh danh mục</label>
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="edit-image"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="edit-image" className={styles.uploadLabel}>
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={120}
                        height={120}
                        className={styles.previewImage}
                        unoptimized
                      />
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <Icon icon="mdi:camera-plus" />
                        <span>Chọn ảnh mới</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button
                className={styles.btnSubmit}
                onClick={handleEditCategory}
                disabled={uploading}
              >
                {uploading ? "Đang xử lý..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCategory && (
        <div className={styles.modal} onClick={() => setShowDetailModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Chi tiết danh mục</h2>
              <button
                className={styles.btnClose}
                onClick={() => setShowDetailModal(false)}
              >
                <Icon icon="mdi:close" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailImage}>
                <Image
                  loader={imageLoader}
                  src={
                    formatImageUrl(selectedCategory.image) ||
                    "/image/category/default.svg"
                  }
                  alt={selectedCategory.name}
                  width={200}
                  height={200}
                  className={styles.categoryImageLarge}
                  unoptimized
                />
              </div>

              <div className={styles.detailInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Tên danh mục:</span>
                  <span className={styles.value}>{selectedCategory.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Slug:</span>
                  <span className={styles.value}>{selectedCategory.slug}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Số bài đăng:</span>
                  <span className={styles.value}>
                    {selectedCategory.posts_count || 0}
                  </span>
                </div>
                {selectedCategory.created_at && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Ngày tạo:</span>
                    <span className={styles.value}>
                      {new Date(selectedCategory.created_at).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
              <button
                className={styles.btnEdit}
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedCategory);
                }}
              >
                <Icon icon="mdi:pencil" />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
