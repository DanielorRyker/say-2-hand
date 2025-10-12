"use client";
import styles from "@/app/home/home.module.scss";
import Category from "@/app/home/component/Category";
import ListPost from "@/app/home/component/ListPost";

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
