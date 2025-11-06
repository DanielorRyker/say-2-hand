"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/styles/pages/auth/register-v2.module.scss";
import { useState, useEffect } from "react";
import axios from "@/lib/api-client";
import Image from "next/image";

interface Address {
  label: string;
  address: string;
  is_default: boolean;
}

interface Province {
  code: number;
  name: string;
  name_en: string;
}

interface District {
  code: number;
  name: string;
  province_code: number;
}

interface Ward {
  code: number;
  name: string;
  district_code: number;
}

const RegisterPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state - chỉ giữ lại các trường bắt buộc
  const [form, setForm] = useState({
    email: "",
    password_hash: "",
    full_name: "",
    phone_number: "",
  });

  const [rePassword, setRePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Address suggestion states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number>(0);
  const [selectedDistrict, setSelectedDistrict] = useState<number>(0);
  const [selectedWard, setSelectedWard] = useState<number>(0);
  const [streetAddress, setStreetAddress] = useState("");

  // API version: true = v2 (2025, 2 cấp), false = v1 (legacy, 3 cấp)
  const [useApiV2, setUseApiV2] = useState<boolean>(true);

  // Load provinces on mount - Sử dụng API route để tránh CORS
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        // Sử dụng Next.js API route thay vì gọi trực tiếp (tránh CORS)
        const apiUrl = useApiV2 ? "/api/provinces-v2" : "/api/provinces";
        const response = await fetch(apiUrl);
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      }
    };
    fetchProvinces();
  }, [useApiV2]);

  // Load districts/wards when province changes - Sử dụng API route
  useEffect(() => {
    if (selectedProvince > 0) {
      const fetchSubdivisions = async () => {
        try {
          if (useApiV2) {
            // API v2 (2025): Province → Ward trực tiếp (bỏ District)
            const response = await fetch(
              `/api/wards?provinceCode=${selectedProvince}&v2=true`
            );
            const data = await response.json();
            console.log("Wards v2 data:", data);
            setWards(data);
            setDistricts([]); // Không có district trong mô hình 2 cấp
            setSelectedDistrict(0);
            setSelectedWard(0);
          } else {
            // API v1 (legacy): Province → District → Ward
            const response = await fetch(
              `/api/districts?provinceCode=${selectedProvince}`
            );
            const data = await response.json();
            setDistricts(data);
            setWards([]);
            setSelectedDistrict(0);
            setSelectedWard(0);
          }
        } catch (error) {
          console.error("Failed to load subdivisions:", error);
        }
      };
      fetchSubdivisions();
    }
  }, [selectedProvince, useApiV2]);

  // Load wards when district changes (only for API v1 legacy) - Sử dụng API route
  useEffect(() => {
    if (!useApiV2 && selectedDistrict > 0) {
      const fetchWards = async () => {
        try {
          const response = await fetch(
            `/api/wards?districtCode=${selectedDistrict}`
          );
          const data = await response.json();
          setWards(data);
          setSelectedWard(0);
        } catch (error) {
          console.error("Failed to load wards:", error);
        }
      };
      fetchWards();
    }
  }, [selectedDistrict, useApiV2]);

  // Validation functions
  const isValidLength =
    form.password_hash.length >= 8 && form.password_hash.length <= 32;
  const hasNumber = /\d/.test(form.password_hash);
  const hasUpperCase = /[A-Z]/.test(form.password_hash);
  const hasLowerCase = /[a-z]/.test(form.password_hash);
  const validateEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  // Strict Vietnamese phone validation
  const validateVietnamesePhone = (phone: string): boolean => {
    // Remove all spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, "");

    // Check if it's 10 or 11 digits
    if (!/^(0\d{9,10})$/.test(cleaned)) {
      return false;
    }

    // Valid Vietnamese phone prefixes
    const validPrefixes = [
      "032",
      "033",
      "034",
      "035",
      "036",
      "037",
      "038",
      "039", // Viettel
      "070",
      "076",
      "077",
      "078",
      "079", // Viettel
      "081",
      "082",
      "083",
      "084",
      "085", // Viettel
      "086",
      "088", // Viettel
      "089",
      "090",
      "093", // Mobifone
      "091",
      "094", // Vinaphone
      "096",
      "097",
      "098", // Mobifone
      "092",
      "052",
      "056",
      "058", // Vinaphone
      "099", // Gmobile
      "059", // Vietnamobile
    ];

    return validPrefixes.some((prefix) => cleaned.startsWith(prefix));
  };

  // Validate name (Vietnamese or foreign with proper capitalization)
  const validatePersonName = (name: string): boolean => {
    // Must have at least 2 words
    const words = name.trim().split(/\s+/);
    if (words.length < 2) {
      return false;
    }

    // Each word must start with uppercase letter
    // Allow Vietnamese diacritics and foreign characters
    const namePattern =
      /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđA-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]*$/;

    return words.every((word) => namePattern.test(word));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validate and set inline errors
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "full_name":
        if (!value.trim()) return "Họ và tên không được để trống";
        if (!validatePersonName(value)) {
          return "Họ tên phải có ít nhất 2 từ, mỗi từ viết hoa chữ cái đầu";
        }
        return "";
      case "email":
        if (!value.trim()) return "Email không được để trống";
        if (!validateEmail) return "Email không hợp lệ";
        return "";
      case "phone_number":
        if (!value.trim()) return "Số điện thoại không được để trống";
        if (!validateVietnamesePhone(value)) {
          return "Số điện thoại không hợp lệ (phải là số Việt Nam hợp lệ)";
        }
        return "";
      case "password_hash":
        if (!value) return "Mật khẩu không được để trống";
        if (!isValidLength) return "Mật khẩu phải từ 8-32 ký tự";
        if (!hasNumber) return "Mật khẩu phải có ít nhất 1 chữ số";
        if (!hasUpperCase) return "Mật khẩu phải có ít nhất 1 chữ hoa";
        if (!hasLowerCase) return "Mật khẩu phải có ít nhất 1 chữ thường";
        return "";
      case "re_password":
        if (!value) return "Vui lòng nhập lại mật khẩu";
        if (value !== form.password_hash) return "Mật khẩu nhập lại không khớp";
        return "";
      default:
        return "";
    }
  };

  // Build full address from selections
  const buildFullAddress = (): string => {
    const parts: string[] = [];

    if (streetAddress.trim()) {
      parts.push(streetAddress.trim());
    }

    if (selectedWard > 0) {
      const ward = wards.find((w) => w.code === selectedWard);
      if (ward) parts.push(ward.name);
    }

    if (!useApiV2 && selectedDistrict > 0) {
      // Only add district for API v1 (legacy 3-level structure)
      const district = districts.find((d) => d.code === selectedDistrict);
      if (district) parts.push(district.name);
    }

    if (selectedProvince > 0) {
      const province = provinces.find((p) => p.code === selectedProvince);
      if (province) parts.push(province.name);
    }

    return parts.join(", ");
  };

  const handleSubmit = async () => {
    // Reset errors
    const newErrors: Record<string, string> = {};

    // Validate all required fields
    const nameError = validateField("full_name", form.full_name);
    if (nameError) newErrors.full_name = nameError;

    const emailError = validateField("email", form.email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validateField("phone_number", form.phone_number);
    if (phoneError) newErrors.phone_number = phoneError;

    const passwordError = validateField("password_hash", form.password_hash);
    if (passwordError) newErrors.password_hash = passwordError;

    const rePasswordError = validateField("re_password", rePassword);
    if (rePasswordError) newErrors.re_password = rePasswordError;

    // Validate address
    if (useApiV2) {
      // API v2 (2025): Mô hình 2 cấp - không cần District
      if (!selectedProvince || !selectedWard || !streetAddress.trim()) {
        newErrors.address =
          "Vui lòng nhập đầy đủ địa chỉ (Tỉnh/Thành phố, Phường/Xã và Số nhà/Đường)";
      }
    } else {
      // API v1 (legacy): Mô hình 3 cấp - cần cả District
      if (
        !selectedProvince ||
        !selectedDistrict ||
        !selectedWard ||
        !streetAddress.trim()
      ) {
        newErrors.address =
          "Vui lòng nhập đầy đủ địa chỉ (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã và Số nhà/Đường)";
      }
    }

    // Validate terms checkbox
    if (!isChecked) {
      newErrors.terms = "Bạn cần đồng ý với Điều khoản sử dụng";
    }

    // If there are errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      // Build complete address
      const fullAddress = buildFullAddress();

      // Build address array with full address
      const addressData: Address[] = [
        {
          label: "Địa chỉ chính",
          address: fullAddress,
          is_default: true,
        },
      ];

      const requestData = {
        ...form,
        addresses: addressData,
      };

      await axios.post("http://localhost:8080/api/users/", requestData, {
        withCredentials: true,
      });

      await axios.get(`http://localhost:8080/api/auth/mail`, {
        params: { email: form.email },
      });

      // Success - redirect to verification
      localStorage.setItem("email", form.email);
      router.push("/auth/verification");
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErrors({ ...errors, email: "Email đã tồn tại trong hệ thống!" });
      } else {
        console.error(error);
        setErrors({
          ...errors,
          submit: "Có lỗi xảy ra, vui lòng thử lại sau!",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>Đăng ký tài khoản</h1>
            <p className={styles.subtitle}>
              Tham gia cộng đồng trao đổi đồ cũ Say2Hand
            </p>
          </div>

          {/* Thông tin cơ bản */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Thông tin cơ bản</h2>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Họ và tên<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  name="full_name"
                  className={`${styles.input} ${errors.full_name ? styles.inputError : ""}`}
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.full_name && (
                <div className={styles.errorMessage}>{errors.full_name}</div>
              )}
              <div className={styles.hint}>
                Họ tên phải có ít nhất 2 từ, mỗi từ viết hoa chữ cái đầu
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Email<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  name="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <div className={styles.errorMessage}>{errors.email}</div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Số điện thoại<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="tel"
                  name="phone_number"
                  className={`${styles.input} ${errors.phone_number ? styles.inputError : ""}`}
                  placeholder="0912345678"
                  value={form.phone_number}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.phone_number && (
                <div className={styles.errorMessage}>{errors.phone_number}</div>
              )}
              <div className={styles.hint}>
                Số điện thoại di động Việt Nam (10-11 số)
              </div>
            </div>
          </div>

          {/* Mật khẩu */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Mật khẩu</h2>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Mật khẩu<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password_hash"
                  className={`${styles.inputPassword} ${errors.password_hash ? styles.inputError : ""}`}
                  placeholder="Nhập mật khẩu"
                  value={form.password_hash}
                  onChange={handleChange}
                  disabled={loading}
                />
                <Image
                  src={
                    showPassword
                      ? "/image/login/mdi_eye_on.svg"
                      : "/image/login/mdi_eye-off.svg"
                  }
                  alt="Toggle"
                  width={24}
                  height={24}
                  className={styles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              {errors.password_hash && (
                <div className={styles.errorMessage}>
                  {errors.password_hash}
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Nhập lại mật khẩu<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type={showRePassword ? "text" : "password"}
                  className={`${styles.inputPassword} ${errors.re_password ? styles.inputError : ""}`}
                  placeholder="Nhập lại mật khẩu"
                  value={rePassword}
                  onChange={(e) => {
                    setRePassword(e.target.value);
                    if (errors.re_password) {
                      setErrors({ ...errors, re_password: "" });
                    }
                  }}
                  disabled={loading}
                />
                <Image
                  src={
                    showRePassword
                      ? "/image/login/mdi_eye_on.svg"
                      : "/image/login/mdi_eye-off.svg"
                  }
                  alt="Toggle"
                  width={24}
                  height={24}
                  className={styles.eyeIcon}
                  onClick={() => setShowRePassword(!showRePassword)}
                />
              </div>
              {errors.re_password && (
                <div className={styles.errorMessage}>{errors.re_password}</div>
              )}
            </div>

            {/* Password validation */}
            <div className={styles.validationGrid}>
              <div
                className={`${styles.validationItem} ${isValidLength ? styles.valid : ""}`}
              >
                <Image
                  src={
                    isValidLength
                      ? "/image/register/VectorCheckOn.svg"
                      : "/image/register/VectorCheckOff.svg"
                  }
                  alt="check"
                  width={20}
                  height={20}
                  className={styles.checkIcon}
                />
                <span>8-32 ký tự</span>
              </div>
              <div
                className={`${styles.validationItem} ${hasNumber ? styles.valid : ""}`}
              >
                <Image
                  src={
                    hasNumber
                      ? "/image/register/VectorCheckOn.svg"
                      : "/image/register/VectorCheckOff.svg"
                  }
                  alt="check"
                  width={20}
                  height={20}
                  className={styles.checkIcon}
                />
                <span>Có chữ số</span>
              </div>
              <div
                className={`${styles.validationItem} ${hasUpperCase ? styles.valid : ""}`}
              >
                <Image
                  src={
                    hasUpperCase
                      ? "/image/register/VectorCheckOn.svg"
                      : "/image/register/VectorCheckOff.svg"
                  }
                  alt="check"
                  width={20}
                  height={20}
                  className={styles.checkIcon}
                />
                <span>Có chữ HOA</span>
              </div>
              <div
                className={`${styles.validationItem} ${hasLowerCase ? styles.valid : ""}`}
              >
                <Image
                  src={
                    hasLowerCase
                      ? "/image/register/VectorCheckOn.svg"
                      : "/image/register/VectorCheckOff.svg"
                  }
                  alt="check"
                  width={20}
                  height={20}
                  className={styles.checkIcon}
                />
                <span>Có chữ thường</span>
              </div>
            </div>
          </div>

          {/* Địa chỉ - Vietnam Address Autocomplete */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              Địa chỉ<span>*</span>
            </h2>
            <p className={styles.subtext}>
              Địa chỉ của bạn sẽ được sử dụng để giao dịch
            </p>

            {/* API Version Toggle */}
            <div className={styles.apiToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={useApiV2}
                  onChange={(e) => {
                    setUseApiV2(e.target.checked);
                    // Reset selections when switching API
                    setSelectedProvince(0);
                    setSelectedDistrict(0);
                    setSelectedWard(0);
                    setProvinces([]);
                    setDistricts([]);
                    setWards([]);
                  }}
                  className={styles.toggleCheckbox}
                />
                <span className={styles.toggleText}>
                  {useApiV2 ? (
                    <>
                      <strong>Sau sáp nhập</strong>
                    </>
                  ) : (
                    <>
                      <strong>Trước sáp nhập</strong>
                    </>
                  )}
                </span>
              </label>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Tỉnh/Thành phố<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  className={`${styles.select} ${errors.address ? styles.inputError : ""}`}
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(Number(e.target.value))}
                  disabled={loading}
                  aria-label="Chọn Tỉnh/Thành phố"
                >
                  <option value={0}>-- Chọn Tỉnh/Thành phố --</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quận/Huyện - Chỉ hiện với API v1 (legacy) */}
            {!useApiV2 && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  Quận/Huyện<span>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <select
                    className={`${styles.select} ${errors.address ? styles.inputError : ""}`}
                    value={selectedDistrict}
                    onChange={(e) =>
                      setSelectedDistrict(Number(e.target.value))
                    }
                    disabled={loading || !selectedProvince}
                    aria-label="Chọn Quận/Huyện"
                  >
                    <option value={0}>-- Chọn Quận/Huyện --</option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Phường/Xã<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  className={`${styles.select} ${errors.address ? styles.inputError : ""}`}
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(Number(e.target.value))}
                  disabled={
                    loading ||
                    (useApiV2 ? !selectedProvince : !selectedDistrict)
                  }
                  aria-label="Chọn Phường/Xã"
                >
                  <option value={0}>-- Chọn Phường/Xã --</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Số nhà, Tên đường<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={`${styles.input} ${errors.address ? styles.inputError : ""}`}
                  placeholder="Ví dụ: Số 123, Đường Nguyễn Văn Linh"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.address && (
                <div className={styles.errorMessage}>{errors.address}</div>
              )}
              <div className={styles.hint}>
                Địa chỉ chi tiết giúp giao dịch nhanh chóng và thuận tiện hơn
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className={styles.checkbox}>
            <input
              type="checkbox"
              id="terms"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <label htmlFor="terms">
              Bằng việc đăng ký, tôi đã đọc và đồng ý với{" "}
              <strong>Điều khoản sử dụng</strong> và{" "}
              <strong>Chính sách bảo mật</strong> của Say2Hand
            </label>
          </div>

          {/* Terms */}
          {errors.terms && (
            <div className={styles.errorMessage}>{errors.terms}</div>
          )}

          {/* Submit error */}
          {errors.submit && (
            <div className={styles.alertError}>{errors.submit}</div>
          )}

          {/* Submit */}
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Tạo tài khoản"}
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span>Hoặc đăng nhập bằng</span>
          </div>

          {/* Social */}
          <div className={styles.socialButtons}>
            <button type="button" title="Đăng nhập với Google">
              <Image
                src="/image/login/IconGoogle.png"
                alt="Google"
                width={32}
                height={32}
              />
            </button>
            <button type="button" title="Đăng nhập với Facebook">
              <Image
                src="/image/login/IconFacebook.png"
                alt="Facebook"
                width={32}
                height={32}
              />
            </button>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            Bạn đã có tài khoản? <Link href="/auth/login">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
