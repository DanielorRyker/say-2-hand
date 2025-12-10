"use client";
import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import styles from "./MessageInput.module.scss";

// Định nghĩa kiểu file preview
type PreviewFile = File | { url: string; type: "image" | "video" };

// Định nghĩa kiểu props cho component
interface MessageInputProps {
  onSend: (data: {
    text: string;
    images: File[];
    videos: File[];
  }) => Promise<void>;
  loading?: boolean;
}

// Component nhập tin nhắn hiện đại, đồng bộ UI
// Thêm xử lý loading, gửi nhiều ảnh, reset input, báo lỗi upload
const MessageInput: React.FC<MessageInputProps> = ({ onSend, loading }) => {
  // State text và images
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]); // Ảnh
  const [videos, setVideos] = useState<File[]>([]); // Video
  const [isUploading, setIsUploading] = useState(false); // Loading khi upload ảnh
  const [error, setError] = useState(""); // Lỗi upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Gửi tin nhắn (text + nhiều ảnh)
  // Gửi tin nhắn (text + ảnh + video)
  // Gửi tin nhắn (text + ảnh + video cùng lúc)
  const handleSend = async () => {
    if (!text.trim() && images.length === 0 && videos.length === 0) return;
    setIsUploading(true);
    setError("");
    try {
      await onSend({ text, images, videos });
      setText("");
      setImages([]);
      setVideos([]);
    } catch (err) {
      setError("Gửi tin nhắn thất bại. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  // Chọn nhiều ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  // Chọn video
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setVideos((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  // Xóa ảnh preview
  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };
  // Xóa video preview
  const handleRemoveVideo = (idx: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      {/* Hiển thị preview ảnh đính kèm phía trên input */}
      {images.length > 0 && (
        <div className={styles.previewImages}>
          {images.map((img, idx) => {
            const url = URL.createObjectURL(img);
            return (
              <div className={styles.previewImageBox} key={idx}>
                <img src={url} alt="preview" />
                <button
                  className={styles.removePreviewBtn}
                  onClick={() => handleRemoveImage(idx)}
                  type="button"
                  aria-label="Xóa ảnh"
                >
                  <Icon icon="mdi:close" width={16} height={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* Hiển thị preview video đính kèm */}
      {videos.length > 0 && (
        <div className={styles.previewImages}>
          {videos.map((video, idx) => {
            const url = URL.createObjectURL(video);
            return (
              <div className={styles.previewImageBox} key={idx}>
                <video src={url} controls className={styles.previewVideo} />
                <button
                  className={styles.removePreviewBtn}
                  onClick={() => handleRemoveVideo(idx)}
                  type="button"
                  aria-label="Xóa video"
                >
                  <Icon icon="mdi:close" width={16} height={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* Hiển thị lỗi upload nếu có */}
      {error && <div className={styles.errorMsg}>{error}</div>}
      <div className={styles.inputBox}>
        {/* Ô nhập tin nhắn */}
        <input
          type="text"
          className={styles.input}
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading || isUploading}
          autoComplete="off"
        />
        {/* Nút đính kèm ảnh */}
        <button
          className={styles.attachBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || isUploading}
          aria-label="Đính kèm ảnh"
          type="button"
        >
          <Icon icon="mdi:paperclip" width={22} height={22} />
        </button>
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          className={styles.hiddenInput}
          onChange={handleImageChange}
          aria-label="Tải lên ảnh"
        />
        {/* Nút đính kèm video */}
        <button
          className={styles.attachBtn}
          onClick={() => videoInputRef.current?.click()}
          disabled={loading || isUploading}
          aria-label="Đính kèm video"
          type="button"
        >
          <Icon icon="mdi:video" width={22} height={22} />
        </button>
        <input
          type="file"
          accept="video/*"
          multiple
          ref={videoInputRef}
          className={styles.hiddenInput}
          onChange={handleVideoChange}
          aria-label="Tải lên video"
        />
        {/* Nút gửi */}
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={
            loading ||
            isUploading ||
            (!text.trim() && images.length === 0 && videos.length === 0)
          }
          aria-label="Gửi"
          type="button"
        >
          {isUploading ? (
            <Icon
              icon="mdi:loading"
              width={22}
              height={22}
              className={styles.loadingIcon}
            />
          ) : (
            <Icon icon="mdi:send" width={22} height={22} />
          )}
        </button>
      </div>
    </>
  );
};

export default MessageInput;
