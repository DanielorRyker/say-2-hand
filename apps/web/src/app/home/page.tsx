"use client";
import styles from "@/app/home/home.module.scss";
import Category from "@/components/pages/home/Category";
import ListPost from "@/components/pages/home/ListPost";

export default function HomePage() {
  return (
    <>
      <div className={`${styles.container} ${styles.headerSpace}`}>
        <Category />
      </div>
      <div className={`${styles.container} ${styles.paddingTop20}`}>
        <ListPost />
      </div>
    </>
  );
}
