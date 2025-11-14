"use client";
import styles from "./category.module.scss";
import axios from "axios";
import { API_BASE, formatImageUrl } from "@/lib/constants";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Category() {
  const router = useRouter();

  //lấy dữ liệu
  interface Category {
    _id: string;
    name?: string;
    slug?: string;
    image?: string;
  }

  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get(`${API_BASE}/api/categories/`);
        setCategoriesData(res.data);
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const handleCategoryClick = (categorySlug?: string) => {
    if (categorySlug) {
      router.push(`/search?category=${categorySlug}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.categoryList}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className={styles.categorySkeleton}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.categoryList}>
        {categoriesData.slice(0, 12).map((category, index) => (
          <button
            key={index}
            type="button"
            className={styles.categoryItem}
            onClick={() => handleCategoryClick(category.slug)}
          >
            <div className={styles.image}>
              <Image
                src={
                  formatImageUrl(category.image) ||
                  "/image/category/default.svg"
                }
                alt={category.name ?? "Danh mục"}
                width={110}
                height={110}
                className={styles.imageItem}
                unoptimized
                priority={index < 6}
              />
            </div>
            <div className={styles.categoryName}>{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
