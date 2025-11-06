"use client";
import { useState, useEffect } from "react";
import axios from "@/lib/api-client";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { formatImageUrl } from "@/lib/constants";
import styles from "./categories.module.scss";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  parent_id?: {
    _id: string;
    name: string;
  } | null;
  posts_count?: number;
  created_at?: string;
}

interface CategoryForm {
  name: string;
  slug?: string;
  image?: string;
  icon?: string;
  parent_id?: string;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
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
  const [suggestingIcon, setSuggestingIcon] = useState(false);

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

  const handleSuggestIcon = async () => {
    if (!categoryForm.name.trim()) {
      alert("Vui lòng nhập tên danh mục trước!");
      return;
    }
    try {
      setSuggestingIcon(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8080/api/categories/suggest-icon",
        { name: categoryForm.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const suggestedIcon = response.data.icon;
      setCategoryForm({ ...categoryForm, icon: suggestedIcon });

      // Hiển thị thông báo thân thiện
      console.log(`✨ AI đã gợi ý icon: ${suggestedIcon}`);
    } catch (error) {
      console.error("Error suggesting icon:", error);

      // Xử lý lỗi một cách thân thiện
      const errorMsg =
        (error as any).response?.data?.message ||
        (error as Error).message ||
        "";
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        alert(
          "⚠️ AI đang quá tải, hệ thống đã tự động chọn icon phù hợp!\nBạn có thể giữ nguyên hoặc thay đổi icon nếu muốn."
        );
      } else {
        alert(
          "⚠️ Không thể kết nối AI, hệ thống đã tự động chọn icon phù hợp!"
        );
      }
    } finally {
      setSuggestingIcon(false);
    }
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
        {
          name: categoryForm.name,
          slug,
          image: imageUrl,
          icon: categoryForm.icon || null,
          parent_id: categoryForm.parent_id || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategories();
      setShowAddModal(false);
      setCategoryForm({ name: "", slug: "", icon: "", parent_id: "" });
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
          icon: categoryForm.icon || null,
          parent_id: categoryForm.parent_id || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategories();
      setShowEditModal(false);
      setSelectedCategory(null);
      setCategoryForm({ name: "", slug: "", icon: "", parent_id: "" });
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
      setSelectedParentId(null);
      alert("Xóa danh mục thành công!");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      const errorMsg =
        error.response?.data?.message || "Có lỗi khi xóa danh mục!";
      alert(errorMsg);
    }
  };

  const openAddModal = (parentId?: string) => {
    setCategoryForm({
      name: "",
      slug: "",
      icon: "",
      parent_id: parentId || "",
    });
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
      icon: category.icon || "",
      parent_id: category.parent_id?._id || "",
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

  // Lọc danh mục cha và con
  const parentCategories = categories.filter((cat) => !cat.parent_id);
  const childCategories = selectedParentId
    ? categories.filter((cat) => cat.parent_id?._id === selectedParentId)
    : [];

  const filteredParentCategories = parentCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChildCount = (parentId: string) => {
    return categories.filter((c) => c.parent_id?._id === parentId).length;
  };

  return (
    <div className={styles.categoriesPage}>
      <div className={styles.header}>
        <div>
          <Icon icon="material-symbols:category" />
          <h1>Quản lý danh mục</h1>
        </div>
        <button className={styles.btnAdd} onClick={() => openAddModal()}>
          <Icon icon="mdi:plus" />
          Thêm danh mục
        </button>
      </div>

      <div className={styles.searchBar}>
        <Icon icon="mdi:magnify" />
        <input
          type="text"
          placeholder="Tìm kiếm danh mục cha..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Layout Master-Detail: Danh mục cha bên trái, Con bên phải */}
      <div className={styles.masterDetailLayout}>
        {/* Cột trái: Danh mục cha (Master) */}
        <div
          className={`${styles.masterColumn} ${selectedParentId ? styles.hasDetail : ""}`}
        >
          <div className={styles.columnHeader}>
            <Icon icon="mdi:folder" />
            <h2>Danh mục cha</h2>
            <span className={styles.badge}>
              {filteredParentCategories.length}
            </span>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <Icon icon="mdi:loading" className={styles.spin} />
              <span>Đang tải...</span>
            </div>
          ) : (
            <div className={styles.categoryList}>
              {filteredParentCategories.map((category) => (
                <div
                  key={category._id}
                  className={`${styles.categoryCard} ${
                    selectedParentId === category._id ? styles.active : ""
                  }`}
                  onClick={() => setSelectedParentId(category._id)}
                >
                  <div className={styles.categoryCardLeft}>
                    <Image
                      loader={imageLoader}
                      src={
                        formatImageUrl(category.image) ||
                        "/image/category/default.svg"
                      }
                      alt={category.name}
                      width={60}
                      height={60}
                      className={styles.categoryImage}
                      unoptimized
                    />
                    <div className={styles.categoryInfo}>
                      <div className={styles.categoryNameRow}>
                        {category.icon && (
                          <Icon icon={category.icon} width={20} height={20} />
                        )}
                        <span className={styles.categoryName}>
                          {category.name}
                        </span>
                      </div>
                      <span className={styles.categorySlug}>
                        {category.slug}
                      </span>
                      <span className={styles.categoryCount}>
                        <Icon icon="mdi:folder-outline" width={14} />
                        {getChildCount(category._id)} danh mục con
                      </span>
                    </div>
                  </div>
                  <div className={styles.categoryActions}>
                    <button
                      className={styles.btnIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddModal(category._id);
                      }}
                      title="Thêm danh mục con"
                    >
                      <Icon icon="mdi:plus-circle" />
                    </button>
                    <button
                      className={styles.btnIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(category);
                      }}
                      title="Chỉnh sửa"
                    >
                      <Icon icon="mdi:pencil" />
                    </button>
                    <button
                      className={styles.btnIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category._id);
                      }}
                      title="Xóa"
                    >
                      <Icon icon="mdi:delete" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Danh mục con (Detail) - Ẩn/hiện trong cùng khung */}
        <div
          className={`${styles.detailColumn} ${selectedParentId ? styles.show : styles.hide}`}
        >
          {selectedParentId && (
            <>
              <div className={styles.columnHeader}>
                <button
                  className={styles.btnBack}
                  onClick={() => setSelectedParentId(null)}
                  title="Đóng"
                >
                  <Icon icon="mdi:close" />
                </button>
                <Icon icon="mdi:folder-outline" />
                <h2>
                  Danh mục con của &ldquo;
                  {
                    parentCategories.find((c) => c._id === selectedParentId)
                      ?.name
                  }
                  &rdquo;
                </h2>
                <span className={styles.badge}>{childCategories.length}</span>
              </div>

              {childCategories.length === 0 ? (
                <div className={styles.emptyState}>
                  <Icon icon="mdi:folder-open-outline" width={48} />
                  <p>Chưa có danh mục con</p>
                  <button
                    className={styles.btnAddChild}
                    onClick={() => openAddModal(selectedParentId)}
                  >
                    <Icon icon="mdi:plus" />
                    Thêm danh mục con
                  </button>
                </div>
              ) : (
                <div className={styles.categoryList}>
                  {childCategories.map((category) => (
                    <div
                      key={category._id}
                      className={styles.categoryCard}
                      onClick={() => openDetailModal(category)}
                    >
                      <div className={styles.categoryCardLeft}>
                        <Image
                          loader={imageLoader}
                          src={
                            formatImageUrl(category.image) ||
                            "/image/category/default.svg"
                          }
                          alt={category.name}
                          width={50}
                          height={50}
                          className={styles.categoryImage}
                          unoptimized
                        />
                        <div className={styles.categoryInfo}>
                          <div className={styles.categoryNameRow}>
                            {category.icon && (
                              <Icon
                                icon={category.icon}
                                width={18}
                                height={18}
                              />
                            )}
                            <span className={styles.categoryName}>
                              {category.name}
                            </span>
                          </div>
                          <span className={styles.categorySlug}>
                            {category.slug}
                          </span>
                          <span className={styles.categoryCount}>
                            <Icon icon="mdi:post-outline" width={14} />
                            {category.posts_count || 0} bài đăng
                          </span>
                        </div>
                      </div>
                      <div className={styles.categoryActions}>
                        <button
                          className={styles.btnIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(category);
                          }}
                          title="Chỉnh sửa"
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        <button
                          className={styles.btnIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category._id);
                          }}
                          title="Xóa"
                        >
                          <Icon icon="mdi:delete" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>
                {categoryForm.parent_id
                  ? "Thêm danh mục con"
                  : "Thêm danh mục cha"}
              </h2>
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
                <label>Slug (Tự động tạo)</label>
                <input
                  type="text"
                  placeholder="Slug"
                  value={categoryForm.slug}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>Icon (Iconify)</label>
                <div className={styles.iconInput}>
                  <input
                    type="text"
                    placeholder="VD: mdi:phone, mdi:laptop..."
                    value={categoryForm.icon}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, icon: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className={styles.suggestButton}
                    onClick={handleSuggestIcon}
                    disabled={suggestingIcon || !categoryForm.name.trim()}
                    title="AI gợi ý icon"
                  >
                    {suggestingIcon ? "⏳" : "✨"}
                  </button>
                  {categoryForm.icon && (
                    <div className={styles.iconPreview}>
                      <Icon icon={categoryForm.icon} width={32} height={32} />
                    </div>
                  )}
                </div>
                <small className={styles.helpText}>
                  Tìm icon tại:{" "}
                  <a
                    href="https://icon-sets.iconify.design/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    icon-sets.iconify.design
                  </a>
                </small>
              </div>

              {!categoryForm.parent_id && (
                <div className={styles.formGroup}>
                  <label>Danh mục cha (Optional)</label>
                  <select
                    title="Chọn danh mục cha"
                    value={categoryForm.parent_id || ""}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        parent_id: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {parentCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Ảnh danh mục</label>
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="add-image"
                    className={styles.hiddenInput}
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
                  placeholder="Slug"
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.target.value })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Icon (Iconify)</label>
                <div className={styles.iconInput}>
                  <input
                    type="text"
                    placeholder="VD: mdi:phone, mdi:laptop..."
                    value={categoryForm.icon}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, icon: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className={styles.suggestButton}
                    onClick={handleSuggestIcon}
                    disabled={suggestingIcon || !categoryForm.name.trim()}
                    title="AI gợi ý icon"
                  >
                    {suggestingIcon ? "⏳" : "✨"}
                  </button>
                  {categoryForm.icon && (
                    <div className={styles.iconPreview}>
                      <Icon icon={categoryForm.icon} width={32} height={32} />
                    </div>
                  )}
                </div>
                <small className={styles.helpText}>
                  Tìm icon tại:{" "}
                  <a
                    href="https://icon-sets.iconify.design/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    icon-sets.iconify.design
                  </a>
                </small>
              </div>

              <div className={styles.formGroup}>
                <label>Danh mục cha</label>
                <select
                  title="Chọn danh mục cha"
                  value={categoryForm.parent_id || ""}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      parent_id: e.target.value,
                    })
                  }
                >
                  <option value="">-- Không có (Danh mục gốc) --</option>
                  {parentCategories
                    .filter((c) => c._id !== selectedCategory._id)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Ảnh danh mục</label>
                <div className={styles.imageUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="edit-image"
                    className={styles.hiddenInput}
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
                {selectedCategory.icon && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Icon:</span>
                    <span className={styles.value}>
                      <Icon
                        icon={selectedCategory.icon}
                        width={24}
                        height={24}
                      />
                      <span className={styles.iconName}>
                        {selectedCategory.icon}
                      </span>
                    </span>
                  </div>
                )}
                {selectedCategory.parent_id && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Danh mục cha:</span>
                    <span className={styles.value}>
                      {selectedCategory.parent_id.name}
                    </span>
                  </div>
                )}
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
