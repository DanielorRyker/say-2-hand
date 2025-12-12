"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./ratingpopup.module.scss";
import { Transaction } from "@repo/types";
import {  formatImageUrl ,API_BASE} from "@/lib/constants";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";


interface Rating {
  _id: string;
  rater_id: string;
  ratee_id: string;
  transaction_id: string;
  post_id: string;
  score: number;
  comment?: string;
}

interface RatingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { userId: string; rating: number; comment?: string }) => Promise<void> | void;
  transaction: Transaction | null;
  initialRating?: number;
}

export default function RatingPopup({ isOpen, onClose, onSubmit, transaction, initialRating = 0 }: RatingPopupProps) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(initialRating);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<{ _id: string; full_name: string ;avatar:string} | null>(
      null
    );
  const [oldRating, setOldRating] = useState<Rating | null>(null);

    useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        router.push("/auth/login");
      }
    }, [router]);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setHover(0);
      setComment("");
      setSubmitting(false);
    }
  }, [isOpen, initialRating]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // ✅ Lấy đánh giá cũ nếu đã từng đánh giá
useEffect(() => {
  if (!isOpen || !transaction || !user) return;

  const fetchExistingRating = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/ratings/find?rater_id=${user._id}&ratee_id=${transaction.seller_id._id}&transaction_id=${transaction._id}`
      );
      const data = res.data;
      if (data) {
        setOldRating(data);
        setRating(data.score || 0);
        setComment(data.comment || "");
      } else {
        // Không có đánh giá cũ => reset
        setOldRating(null);
        setRating(0);
        setComment("");
      }
    } catch (err: any) {
      // Nếu lỗi là 404 hoặc tương tự thì bỏ qua
      if (err.response?.status === 404) {
        setOldRating(null);
        setRating(0);
        setComment("");
      } else {
        console.error("⚠️ Lỗi khi tải đánh giá cũ:", err.message);
      }
    }
  };

  fetchExistingRating();
}, [isOpen, transaction, user]);



  const handleSubmit = async () => {
    if (!transaction) return;
    if (rating === 0) {
      alert("Vui lòng chọn số sao để đánh giá");
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({ userId: transaction.seller_id._id, rating, comment: comment.trim() || undefined });
      if(oldRating){
         await axios.patch(`${API_BASE}/api/ratings/${oldRating._id}`, {
          score: rating,
          comment: comment.trim() || undefined,
        });
      }
      else{
        await axios.post(`${API_BASE}/api/ratings`, {
          rater_id: user?._id, 
          ratee_id: transaction.seller_id._id,
          transaction_id: transaction._id,
          post_id: transaction.post_id._id,
          score: Number(rating),
        comment: comment.trim() || undefined
      });
      }
     
      alert("Bạn đã đánh giá thành công");
      onClose();
    } catch (err: any) {
      console.error(err);
      console.error("❌ Lỗi gửi đánh giá:", err.response?.data || err.message);
      alert("Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={styles.modal}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <Image
              src={formatImageUrl(transaction.seller_id.avatar) || "/default-avatar.png"}
              alt={transaction.seller_id.full_name || "User"}
              className={styles.avatar}
               width={100}
              height={100}
            />
            <div className={styles.name}>{transaction.seller_id.full_name || "Người dùng"}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.stars} aria-hidden={submitting}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className={`${styles.star} ${i <= (hover || rating) ? styles.filled : ""}`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${i} sao`}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            className={styles.textarea}
            placeholder="Viết nhận xét (tuỳ chọn)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={4}
            disabled={submitting}
          />
        </div>

        <footer className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose} disabled={submitting}>Hủy</button>
          <button
            className={styles.btnSubmit}
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </footer>
      </div>
    </div>
  );
}