"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./payment.module.scss";
import axios from "axios";
import PaymentComponent from "./component";

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [postData, setPostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  useEffect(() => {
    if (!postId) {
      console.error("No postId provided in URL");
      router.push("/home");
      return;
    }

    async function fetchPostData() {
      try {
        console.log("Fetching post data for ID:", postId);

        // Thử lấy từ sessionStorage trước (nhanh hơn)
        const cachedData = sessionStorage.getItem(`selectedPost_${postId}`);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            console.log(
              "✅ Using cached post data from sessionStorage:",
              parsed
            );
            setPostData(parsed);
            setLoading(false);
            return; // Dùng cache, không cần gọi API
          } catch (parseError) {
            console.error("❌ Error parsing cached data:", parseError);
          }
        }

        // Nếu không có cache, gọi API
        console.log("📡 No cache found, fetching from API...");
        const res = await axios.get(
          `http://localhost:8080/api/posts/${postId}`
        );
        console.log("✅ Post data fetched successfully from API:", res.data);
        setPostData(res.data);

        // Lưu vào cache để dùng lần sau
        try {
          sessionStorage.setItem(
            `selectedPost_${postId}`,
            JSON.stringify(res.data)
          );
          console.log("💾 Saved post data to sessionStorage");
        } catch (storageError) {
          console.warn("⚠️ Could not save to sessionStorage:", storageError);
        }
      } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        console.error("❌ Error loading post from API:", {
          postId,
          status,
          message,
          error: error.response?.data,
        });

        // Xử lý theo loại lỗi
        if (status === 404) {
          alert(
            `Không tìm thấy sản phẩm (ID: ${postId}). Sản phẩm có thể đã bị xóa hoặc không tồn tại.`
          );
        } else if (status === 500) {
          alert("Lỗi server. Vui lòng thử lại sau.");
        } else {
          alert(`Không thể tải thông tin sản phẩm. Lỗi: ${message}`);
        }

        // Redirect về trang trước hoặc home
        router.back();
      } finally {
        setLoading(false);
      }
    }

    fetchPostData();
  }, [postId, router]);

  if (loading) {
    return (
      <div className={styles["payment-page"]}>
        <div className={styles.container}>
          <div className={styles["loading-skeleton"]}>
            <div className={styles["skel-header"]}></div>
            <div className={styles["skel-content"]}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    router.push(`/auth/login?redirect=/payment?postId=${postId}`);
    return null;
  }

  return (
    <div className={styles["payment-page"]}>
      <div className={styles.container}>
        <PaymentComponent
          postData={postData}
          currentUser={currentUser}
          onBack={() => router.back()}
        />
      </div>
    </div>
  );
};

export default PaymentPage;
