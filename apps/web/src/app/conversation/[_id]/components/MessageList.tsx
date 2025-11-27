"use client";
import React from "react";
import MessageItem from "./MessageItem";
import styles from "./MessageList.module.scss";
import { formatImageUrl } from "@/lib/constants";

// Hàm format loại giao dịch
function getTransactionType(type) {
  if (!type) return "";
  if (["sell", "bán", "ban"].includes(type.toLowerCase())) return "Bán";
  if (
    ["exchange", "trao đổi", "trao doi", "trade"].includes(type.toLowerCase())
  )
    return "Trao đổi";
  if (["give away", "tặng", "mien phi", "free"].includes(type.toLowerCase()))
    return "Cho tặng";
  return type;
}

// Thêm prop: currentPost, sellerId

// Hàm render block sản phẩm hệ thống
// Block sản phẩm hệ thống, truyền ref để scroll tới
const SystemProductBlock = React.forwardRef(
  ({ product, isBuyer, buyerName }, ref) => {
    return (
      <div className={styles.productInfoBlock} ref={ref}>
        <div className={styles.productInfoLabel}>
          {isBuyer
            ? "Bạn đang quan tâm đến sản phẩm này"
            : `${buyerName} đang quan tâm đến sản phẩm này của bạn`}
        </div>
        <div className={styles.productInfoRow}>
          <img
            src={formatImageUrl(product.image)}
            alt="product"
            className={styles.productInfoImg}
          />
          <div>
            <div className={styles.productInfoTitle}>{product.title}</div>
            <div className={styles.productInfoPrice}>
              {typeof product.price === "number"
                ? product.price.toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })
                : product.price}
            </div>
            <div className={styles.productInfoMeta}>
              {product.transaction_type && (
                <span className={styles.productInfoMetaItem}>
                  <span>Hình thức:</span>
                  <b>{getTransactionType(product.transaction_type)}</b>
                </span>
              )}
              {product.condition && (
                <span className={styles.productInfoMetaItem}>
                  <span>Tình trạng:</span>
                  <b>{product.condition}</b>
                </span>
              )}
            </div>
            {isBuyer && (
              <button
                className={styles.productInfoDetailBtn}
                onClick={() => {
                  window.open(
                    `/post/detailPost?postId=${product._id}`,
                    "_blank"
                  );
                }}
              >
                Mua ngay
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

import { useRef, useEffect } from "react";

const MessageList = ({ messages, currentUserId }) => {
  // Ref cho scroll tổng
  const listRef = useRef(null);

  // Scroll xuống cuối mỗi khi messages thay đổi
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.messageList} ref={listRef}>
      {messages.map((msg, idx) => {
        if (msg.type === "system" && msg.text) {
          let product = null;
          let isBuyer = false;
          let buyerName = "Người dùng";
          try {
            const data = JSON.parse(msg.text);
            product = data.product;
            isBuyer = data.buyer_id === currentUserId;
            buyerName = msg.buyerName || "Người dùng";
          } catch {}
          if (product) {
            return (
              <SystemProductBlock
                key={msg._id}
                product={product}
                isBuyer={isBuyer}
                buyerName={buyerName}
              />
            );
          }
        }
        // Tin nhắn thường
        return (
          <MessageItem
            key={msg._id}
            message={msg}
            isOwn={msg.sender_id === currentUserId}
          />
        );
      })}
    </div>
  );
};

export default MessageList;
