"use client";
import styles from "@/styles/pages/home/category.module.scss";
import Image from "next/image";

export default function Category() {
  const categories = [
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
    { name: "Xe cộ", image: "/image/category/xe.svg" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.categoryList}>
        {categories.map((category, index) => (
          <button key={index} type="button" className={styles.categoryItem}>
            <div className={styles.image}>
              <Image
                src={category.image}
                alt={category.name}
                width={150}
                height={150}
              />
              <p>{category.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
