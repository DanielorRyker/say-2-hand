"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./CreatePost.module.scss";
import stylesBasicForm from "./components/BasicInfoForm.module.scss";
import {
  ProgressBar,
  ImageUploader,
  BasicInfoForm,
  CategoryForm,
  FloatingMessage,
} from "./components";
import axios from "axios";
import geminiStyles from "./components/GeminiSuggestion.module.scss";
// ✅ Import parseAddress
import { parseAddress } from "../../../lib/address";
// Gemini AI suggestion integration
function useGeminiSuggestion() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (
    base64: string,
    mimeType: string = "image/jpeg"
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/gemini/analyze-image",
        {
          base64,
          mimeType,
        }
      );
      console.log("Gemini FE response:", response.data);
      setSuggestions(response.data.suggestedTags || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "AI suggestion failed");
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, error, analyzeImage };
}

type PostFormData = {
  title: string;
  description: string;
  condition:
    | "used"
    | "new"
    | "like new"
    | "minor flaw"
    | "for repair"
    | "for parts";
  // allow both variants to match different components
  transaction_type: "sell" | "exchange" | "give away";
  price: number | null;
  category_id: string;
  // một input địa chỉ đơn thay thế cho tỉnh/quận/đường
  location: {
    address: string;
    coords?: { lat: number; lon: number }; // ✅ Thêm dòng này
    // CÁC TRƯỜNG PHÂN TÁCH ĐỊA CHỈ
    detail_address?: string; // Địa chỉ chi tiết: số nhà, hẻm, đường
    ward?: string; // Phường / Xã / Thị trấn
    province?: string; // Tỉnh / Thành phố
  };
  tags?: string[];
  custom_fields: Record<string, any>;
};

export default function Page() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // Gemini AI suggestion state
  const gemini = useGeminiSuggestion();

  //Lấy User
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    setCurrentUser(userData ? JSON.parse(userData) : null);
  }, []);

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    description: "",
    condition: "used",
    transaction_type: "sell",
    price: null,
    category_id: "",
    location: { address: "" },
    tags: [],
    custom_fields: {},
  });

  function showMessage(msg: string, duration = 3000) {
    setMessage(msg);
    setTimeout(() => setMessage(null), duration);
  }

  function nextStep() {
    setCurrentStep((s) => Math.min(s + 1, 3));
  }
  function prevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  // ✅ Chuyển base64 → File

  useEffect(() => {
    // Load từ localStorage khi mount
    const savedImages = localStorage.getItem("uploadedImages");
    if (savedImages) {
      try {
        const parsed = JSON.parse(savedImages);
        if (Array.isArray(parsed)) setImages(parsed);
      } catch (err) {
        console.error("Error parsing saved images:", err);
      }
    }
  }, []);

  // Đồng bộ images → selectedFiles
  // Track last analyzed image to prevent infinite loop (useRef instead of state)
  const lastAnalyzedImageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!images || images.length === 0) {
      setSelectedFiles([]);
      return;
    }

    const files = images.map((base64, i) =>
      base64ToFile(base64, `image_${i + 1}.png`)
    );
    setSelectedFiles(files);
  }, [images]);

  // Only call Gemini AI if first image changes
  const firstImage = images.length > 0 ? images[0] : null;
  useEffect(() => {
    if (firstImage) {
      let base64 = firstImage;
      let mimeType = "image/jpeg";
      if (base64.includes(",")) {
        const match = base64.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          mimeType = match[1] || "image/jpeg";
          base64 = match[2];
        } else {
          base64 = base64.split(",")[1];
        }
      }
      if (base64 !== lastAnalyzedImageRef.current) {
        gemini.analyzeImage(base64, mimeType);
        lastAnalyzedImageRef.current = base64;
      }
    }
  }, [firstImage, gemini]);

  function base64ToFile(base64: string, filename: string) {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // ✅ Load ảnh từ localStorage (ở trang khác lưu base64)

  useEffect(() => {
    const interval = setInterval(() => {
      const savedImages = localStorage.getItem("uploadedImages");
      if (savedImages) {
        try {
          const parsed = JSON.parse(savedImages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const files = parsed.map((base64: string, i: number) =>
              base64ToFile(base64, `image_${i + 1}.png`)
            );
            setSelectedFiles(files);
            {
              /* Gemini AI suggestions UI */
            }
            {
              gemini.loading ? (
                <div className={geminiStyles.loading}>Đang phân tích AI...</div>
              ) : null;
            }
            {
              gemini.error ? (
                <div className={geminiStyles.error}>{gemini.error}</div>
              ) : null;
            }
            {
              gemini.suggestions.length > 0 ? (
                <div className={geminiStyles.suggestionBox}>
                  <h4>Gợi ý từ AI:</h4>
                  <ul>
                    {gemini.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null;
            }
            clearInterval(interval); // ✅ Dừng khi đã có ảnh
          }
        } catch (err) {
          console.error("Error parsing saved images:", err);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Upload ảnh lên server (NestJS endpoint /upload/imgs)
  const uploadImages = async (
    files: File[],
    title: string
  ): Promise<string[]> => {
    if (!files || files.length === 0) {
      console.warn("No files to upload.");
      return [];
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("bucket", "posts/" + currentUser._id + "/" + title);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/upload/imgs",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Upload response:", res.data);
      return res.data.filenames; // giả sử BE trả về { filenames: [...] }
    } catch (err: any) {
      console.error("Upload error:", err);
      return [];
    }
  };

  // Helper function to convert condition format from frontend to backend
  const formatConditionForBackend = (condition: string): string => {
    const conditionMap: Record<string, string> = {
      new: "new",
      used: "used",
      "like new": "like_new",
      "minor flaw": "minor_flaw",
      "for repair": "for_repair",
      "for parts": "for_parts",
    };
    return conditionMap[condition] || condition;
  };

  //Bấm nút đăng tin

  async function handleSubmit() {
    if (images.length === 0) {
      showMessage("Vui lòng tải lên ít nhất 1 ảnh.");
      setCurrentStep(1);
      return;
    }
    if (!formData.title.trim() || !formData.description.trim()) {
      showMessage("Vui lòng nhập tiêu đề và mô tả.");
      setCurrentStep(2);
      return;
    }
    if (!formData.category_id) {
      showMessage("Vui lòng chọn danh mục.");
      setCurrentStep(3);
      return;
    }

    console.log("Dữ liệu tin đăng:", { images, formData });

    setLoading(true);
    try {
      // Upload ảnh
      const uploadedUrls = await uploadImages(selectedFiles, formData.title);
      if (!uploadedUrls || uploadedUrls.length === 0) {
        setLoading(false);
        showMessage("Không thể tải ảnh lên, vui lòng thử lại.");
        return;
      }

      // ✅ Bắt đầu xử lý tách địa chỉ
      let locationPayload: any = undefined;
      if (formData.location?.address) {
        // Tách địa chỉ tổng thành 3 trường chi tiết
        const { detail, ward, province } = parseAddress(
          formData.location.address
        );

        // Tạo cấu trúc location (address là string theo schema backend)
        locationPayload = {
          address: formData.location.address, // giữ chuỗi đầy đủ
          detail_address: detail || undefined, // Dùng detail, nếu không tách được thì dùng chuỗi đầy đủ
          ward: ward || undefined,
          province: province || undefined,
          // Xử lý tọa độ nếu có
          geo: formData.location.coords
            ? {
                type: "Point",
                coordinates: [
                  formData.location.coords.lon,
                  formData.location.coords.lat,
                ],
              }
            : undefined,
        };
      }
      // ✅ Kết thúc xử lý tách địa chỉ

      // Format lại dữ liệu
      const payload = {
        author_id: currentUser._id, // ObjectId người đăng
        category_id: formData.category_id, // ObjectId danh mục
        title: formData.title,
        description: formData.description,
        images: uploadedUrls.map((url: string, i: number) => ({
          url,
          alt: `image_${i + 1}`,
        })),
        condition: formatConditionForBackend(formData.condition),
        transaction_type:
          formData.transaction_type === "give away"
            ? "give away"
            : formData.transaction_type, // Map lại nếu FE dùng "give away"
        price: formData.price ?? null,
        // location: Bỏ logic cũ, dùng locationPayload đã xử lý
        location: locationPayload,
        custom_fields: formData.custom_fields || {},
        tags: formData.tags?.length ? formData.tags : [],
      };
      console.log("📦 Dữ liệu gửi BE:", payload);

      await axios.post("http://localhost:8080/api/posts", payload, {
        headers: { "Content-Type": "application/json" },
      });
      showMessage("Đăng tin thành công!");
      setLoading(false);
      // chuyển về trang home
      router.push("/");
      // ✅ Xoá cache ảnh
      localStorage.removeItem("uploadedImages");
    } catch (err) {
      console.error("Lỗi khi đăng tin:", err);
      setLoading(false);
      showMessage("Lỗi khi đăng tin. Vui lòng thử lại.");
    }
  }
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Đăng Tin Mới</h1>
      <ProgressBar step={currentStep} />

      <div className={styles.section}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} aria-hidden="true" />
          </div>
        )}
        {currentStep === 1 && (
          <section>
            <h2 className={styles.sectionTitle}>1. Tải lên hình ảnh</h2>
            <ImageUploader
              images={images}
              setImages={setImages}
              showMessage={showMessage}
            />
            <div className={styles.actionsRow}>
              <button
                className={stylesBasicForm.btnPrimary}
                onClick={() => {
                  if (images.length === 0)
                    return showMessage("Vui lòng tải lên ít nhất 1 ảnh.");
                  if (gemini.loading) {
                    return showMessage("Đang phân tích AI, vui lòng chờ...");
                  }
                  nextStep();
                }}
                disabled={loading || gemini.loading}
              >
                {gemini.loading ? "Đang phân tích AI..." : "Tiếp tục"}
              </button>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <BasicInfoForm
            formData={formData}
            setFormData={
              setFormData as unknown as React.Dispatch<
                React.SetStateAction<any>
              >
            }
            onPrev={prevStep}
            onNext={nextStep}
            showMessage={showMessage}
          />
        )}

        {currentStep === 3 && (
          <CategoryForm
            formData={formData}
            setFormData={
              setFormData as unknown as React.Dispatch<
                React.SetStateAction<any>
              >
            }
            addressData={formData.location}
            customFieldData={formData.custom_fields}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            loading={loading}
            showMessage={showMessage}
            aiTags={gemini.suggestions}
          />
        )}
      </div>

      <FloatingMessage message={message} />
    </div>
  );
}
