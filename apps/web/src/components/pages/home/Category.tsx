"use client";
import styles from "@/styles/pages/home/category.module.scss";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Category() {


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

 

  return (
    <div className={styles.container}>
      <div className={styles.categoryList}>
        {categoriesData.map((category, index) => (
          <button key={index} type="button" className={styles.categoryItem}>
            <div className={styles.image}>
              
              <Image
                src={
                  process.env.NEXT_PUBLIC_URL_GCS && category.image
                    ? process.env.NEXT_PUBLIC_URL_GCS + category.image
                    : "/image/category/default.svg"
                }
                alt={category.name ?? "Danh mục"}
                width={110}
                height={110}
                className={styles.imageItem}
                unoptimized
              />
            </div>
            <div className={styles.categoryName}>{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
