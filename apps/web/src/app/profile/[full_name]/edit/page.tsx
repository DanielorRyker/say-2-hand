"use client";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/profile/edit-v2.module.scss";
import { useState, useEffect } from "react";
import axios from "axios";

interface Address {
  label: string;
  address: string;
  is_default: boolean;
}

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
}

interface UserData {
  _id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar?: string;
  description?: string;
  date_of_birth?: string;
  addresses?: Address[];
  bank_accounts?: BankAccount[];
}

const EditProfilePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState<UserData>({
    _id: "",
    email: "",
    full_name: "",
    phone_number: "",
    avatar: "",
    description: "",
    date_of_birth: "",
    addresses: [],
    bank_accounts: [],
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Modals
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(
    null
  );
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);

  const [newAddress, setNewAddress] = useState<Address>({
    label: "",
    address: "",
    is_default: false,
  });

  // Address autocomplete states
  const [useApiV2, setUseApiV2] = useState<boolean>(true);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number>(0);
  const [selectedDistrict, setSelectedDistrict] = useState<number>(0);
  const [selectedWard, setSelectedWard] = useState<number>(0);
  const [street, setStreet] = useState<string>("");
  const [addressError, setAddressError] = useState<string>("");

  const [newBank, setNewBank] = useState<BankAccount>({
    bank_name: "",
    account_number: "",
    account_holder: "",
    is_default: false,
  });

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setForm({
        _id: parsedUser._id || "",
        email: parsedUser.email || "",
        full_name: parsedUser.full_name || "",
        phone_number: parsedUser.phone_number || "",
        avatar: parsedUser.avatar || "",
        description: parsedUser.description || "",
        date_of_birth: parsedUser.date_of_birth
          ? new Date(parsedUser.date_of_birth).toISOString().split("T")[0]
          : "",
        addresses: parsedUser.addresses || [],
        bank_accounts: parsedUser.bank_accounts || [],
      });

      if (parsedUser.avatar) {
        setPreview(process.env.NEXT_PUBLIC_URL_GCS + parsedUser.avatar);
      }
    }
  }, []);

  // Load provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        const apiUrl = useApiV2
          ? "https://provinces.open-api.vn/api/v2/p/"
          : "https://provinces.open-api.vn/api/p/";

        const response = await axios.get(apiUrl);
        setProvinces(response.data);
      } catch (error) {
        console.error("Failed to load provinces, trying fallback:", error);
        if (useApiV2) {
          setUseApiV2(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, [useApiV2]);

  // Load subdivisions (districts for v1, wards for v2)
  useEffect(() => {
    if (selectedProvince === 0) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict(0);
      setSelectedWard(0);
      return;
    }

    const fetchSubdivisions = async () => {
      try {
        setLoading(true);
        const province = provinces.find((p) => p.code === selectedProvince);
        if (!province) return;

        if (useApiV2) {
          // v2: Load wards directly from province
          const response = await axios.get(
            `https://provinces.open-api.vn/api/v2/p/${selectedProvince}?depth=2`
          );
          setWards(response.data.wards || []);
          setDistricts([]); // No districts in v2
        } else {
          // v1: Load districts from province
          const response = await axios.get(
            `https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`
          );
          setDistricts(response.data.districts || []);
          setWards([]); // Clear wards, will load after district selection
        }
      } catch (error) {
        console.error("Failed to load subdivisions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubdivisions();
  }, [selectedProvince, provinces, useApiV2]);

  // Load wards from district (v1 only)
  useEffect(() => {
    if (!useApiV2 && selectedDistrict > 0) {
      const fetchWards = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`
          );
          setWards(response.data.wards || []);
        } catch (error) {
          console.error("Failed to load wards:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchWards();
    }
  }, [selectedDistrict, useApiV2]);

  if (!mounted) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUploadAvatar = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", form._id);

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8080/api/upload/avatar",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const imageUrl = res.data.url;
      const avatarPath = imageUrl.split("say2hand/")[1];

      setForm((prev) => ({ ...prev, avatar: avatarPath }));
      alert("Upload ảnh thành công!");

      // Refresh user data
      const token = localStorage.getItem("access_token");
      const userRes = await axios.get(
        `http://localhost:8080/api/users/find/${form.email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.setItem("user", JSON.stringify(userRes.data));
    } catch (err: any) {
      if (err.response?.status === 401) {
        alert("Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại!");
        router.push("/auth/login");
      } else {
        console.error("Upload failed:", err);
        alert("Upload ảnh thất bại!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Build full address from selections
  const buildFullAddress = (): string => {
    const parts: string[] = [];

    if (street.trim()) {
      parts.push(street.trim());
    }

    const ward = wards.find((w) => w.code === selectedWard);
    if (ward) {
      parts.push(ward.name);
    }

    if (!useApiV2 && selectedDistrict > 0) {
      const district = districts.find((d) => d.code === selectedDistrict);
      if (district) {
        parts.push(district.name);
      }
    }

    const province = provinces.find((p) => p.code === selectedProvince);
    if (province) {
      parts.push(province.name);
    }

    return parts.join(", ");
  };

  // Reset address form
  const resetAddressForm = () => {
    setSelectedProvince(0);
    setSelectedDistrict(0);
    setSelectedWard(0);
    setStreet("");
    setAddressError("");
    setNewAddress({ label: "", address: "", is_default: false });
  };

  // Address management
  const openAddressModal = (index?: number) => {
    if (index !== undefined && form.addresses && form.addresses[index]) {
      setNewAddress(form.addresses[index]);
      setEditingAddressIndex(index);
    } else {
      resetAddressForm();
      setEditingAddressIndex(null);
    }
    setShowAddressModal(true);
  };

  const saveAddress = () => {
    // Validate address fields
    if (useApiV2) {
      if (!selectedProvince || !selectedWard || !street.trim()) {
        setAddressError(
          "Vui lòng nhập đầy đủ địa chỉ (Tỉnh/TP, Phường/Xã và Số nhà/Đường)"
        );
        return;
      }
    } else {
      if (
        !selectedProvince ||
        !selectedDistrict ||
        !selectedWard ||
        !street.trim()
      ) {
        setAddressError(
          "Vui lòng nhập đầy đủ địa chỉ (Tỉnh/TP, Quận/Huyện, Phường/Xã và Số nhà/Đường)"
        );
        return;
      }
    }

    const fullAddress = buildFullAddress();
    const addressToSave = {
      ...newAddress,
      address: fullAddress,
    };

    let updatedAddresses = [...(form.addresses || [])];

    if (addressToSave.is_default) {
      updatedAddresses = updatedAddresses.map((addr) => ({
        ...addr,
        is_default: false,
      }));
    }

    if (editingAddressIndex !== null) {
      updatedAddresses[editingAddressIndex] = addressToSave;
    } else {
      updatedAddresses.push(addressToSave);
    }

    setForm({ ...form, addresses: updatedAddresses });
    setShowAddressModal(false);
    resetAddressForm();
    setEditingAddressIndex(null);
  };

  const removeAddress = (index: number) => {
    if (window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
      const updatedAddresses = form.addresses?.filter((_, i) => i !== index);
      setForm({ ...form, addresses: updatedAddresses });
    }
  };

  // Bank account management
  const openBankModal = (index?: number) => {
    if (
      index !== undefined &&
      form.bank_accounts &&
      form.bank_accounts[index]
    ) {
      setNewBank(form.bank_accounts[index]);
      setEditingBankIndex(index);
    } else {
      setNewBank({
        bank_name: "",
        account_number: "",
        account_holder: "",
        is_default: false,
      });
      setEditingBankIndex(null);
    }
    setShowBankModal(true);
  };

  const saveBank = () => {
    if (
      !newBank.bank_name.trim() ||
      !newBank.account_number.trim() ||
      !newBank.account_holder.trim()
    ) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    let updatedBanks = [...(form.bank_accounts || [])];

    if (newBank.is_default) {
      updatedBanks = updatedBanks.map((bank) => ({
        ...bank,
        is_default: false,
      }));
    }

    if (editingBankIndex !== null) {
      updatedBanks[editingBankIndex] = newBank;
    } else {
      updatedBanks.push(newBank);
    }

    setForm({ ...form, bank_accounts: updatedBanks });
    setShowBankModal(false);
    setNewBank({
      bank_name: "",
      account_number: "",
      account_holder: "",
      is_default: false,
    });
    setEditingBankIndex(null);
  };

  const removeBank = (index: number) => {
    if (window.confirm("Bạn có chắc muốn xóa tài khoản ngân hàng này?")) {
      const updatedBanks = form.bank_accounts?.filter((_, i) => i !== index);
      setForm({ ...form, bank_accounts: updatedBanks });
    }
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      await axios.patch(`http://localhost:8080/api/users/`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userRes = await axios.get(
        `http://localhost:8080/api/users/find/${form.email}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      localStorage.setItem("user", JSON.stringify(userRes.data));
      alert("Cập nhật thành công!");
      router.push(`/profile/${form.full_name}`);
    } catch (err: any) {
      if (err.response?.status === 401) {
        alert("Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại!");
        router.push("/auth/login");
      } else {
        console.error("Update failed:", err);
        alert("Cập nhật thất bại!");
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.card}>
            {/* Avatar Section */}
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {preview ? (
                  <div
                    className={`${styles.avatar} ${styles.avatarImage}`}
                    style={{ backgroundImage: `url(${preview})` }}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {getInitials(form.full_name || "U")}
                  </div>
                )}
                <label
                  className={styles.avatarUploadBtn}
                  htmlFor="avatar-upload"
                >
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label="Upload avatar"
                  />
                  📷
                </label>
              </div>
              {file && (
                <button
                  className={styles.btnPrimary}
                  onClick={handleUploadAvatar}
                  disabled={loading}
                  type="button"
                >
                  Upload ảnh
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Thông tin cơ bản</h2>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>
                    Họ và tên<span>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      name="full_name"
                      className={styles.input}
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Email</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="email"
                      name="email"
                      className={styles.input}
                      value={form.email}
                      disabled
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Số điện thoại</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="tel"
                      name="phone_number"
                      className={styles.input}
                      value={form.phone_number || ""}
                      onChange={handleChange}
                      placeholder="0912345678"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Ngày sinh</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="date"
                      name="date_of_birth"
                      className={styles.input}
                      value={form.date_of_birth || ""}
                      onChange={handleChange}
                      title="Chọn ngày sinh"
                    />
                  </div>
                </div>

                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Giới thiệu</label>
                  <div className={styles.inputWrapper}>
                    <textarea
                      name="description"
                      className={styles.textarea}
                      value={form.description || ""}
                      onChange={handleChange}
                      placeholder="Chia sẻ một chút về bạn..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Địa chỉ</h2>
              <div className={styles.addressList}>
                {form.addresses?.map((addr, index) => (
                  <div
                    key={index}
                    className={`${styles.addressItem} ${addr.is_default ? styles.default : ""}`}
                  >
                    <div className={styles.addressContent}>
                      <div className={styles.addressLabel}>
                        {addr.label || "Địa chỉ"}
                        {addr.is_default && (
                          <span className={styles.defaultBadge}>Mặc định</span>
                        )}
                      </div>
                      <div className={styles.addressText}>{addr.address}</div>
                    </div>
                    <div className={styles.flexGap}>
                      <button
                        className={styles.btnSmall}
                        onClick={() => openAddressModal(index)}
                        type="button"
                      >
                        Sửa
                      </button>
                      <button
                        className={styles.btnSmall}
                        onClick={() => removeAddress(index)}
                        type="button"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={styles.btnAdd}
                onClick={() => openAddressModal()}
                type="button"
              >
                + Thêm địa chỉ
              </button>
            </div>

            {/* Bank Accounts */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Tài khoản ngân hàng</h2>
              <div className={styles.bankList}>
                {form.bank_accounts?.map((bank, index) => (
                  <div
                    key={index}
                    className={`${styles.bankItem} ${bank.is_default ? styles.default : ""}`}
                  >
                    <div className={styles.bankContent}>
                      <div className={styles.bankName}>
                        {bank.bank_name}
                        {bank.is_default && (
                          <span className={styles.defaultBadge}>Mặc định</span>
                        )}
                      </div>
                      <div className={styles.bankInfo}>
                        STK: {bank.account_number}
                      </div>
                      <div className={styles.bankInfo}>
                        Chủ TK: {bank.account_holder}
                      </div>
                    </div>
                    <div className={styles.flexGap}>
                      <button
                        className={styles.btnSmall}
                        onClick={() => openBankModal(index)}
                        type="button"
                      >
                        Sửa
                      </button>
                      <button
                        className={styles.btnSmall}
                        onClick={() => removeBank(index)}
                        type="button"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={styles.btnAdd}
                onClick={() => openBankModal()}
                type="button"
              >
                + Thêm tài khoản ngân hàng
              </button>
            </div>

            {/* Buttons */}
            <div className={styles.buttonGroup}>
              <button
                className={styles.btnSecondary}
                onClick={() => router.push(`/profile/${form.full_name}`)}
                type="button"
              >
                Hủy
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleSubmit}
                disabled={loading}
                type="button"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div
          className={styles.modal}
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>
              {editingAddressIndex !== null
                ? "Sửa địa chỉ"
                : "Thêm địa chỉ mới"}
            </h3>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Nhãn</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Nhà riêng, Văn phòng..."
                  value={newAddress.label}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, label: e.target.value })
                  }
                />
              </div>
            </div>

            {/* API Version Toggle */}
            <div className={styles.apiToggle}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.toggleCheckbox}
                  checked={useApiV2}
                  onChange={(e) => {
                    setUseApiV2(e.target.checked);
                    setSelectedProvince(0);
                    setSelectedDistrict(0);
                    setSelectedWard(0);
                    setStreet("");
                    setAddressError("");
                  }}
                />
                <span className={styles.toggleText}>
                  {useApiV2 ? (
                    <strong>
                      ✅ Cấu trúc 2025 (34 tỉnh, mô hình 2 cấp - bỏ Quận/Huyện)
                    </strong>
                  ) : (
                    <strong>📋 Cấu trúc cũ (63 tỉnh, mô hình 3 cấp)</strong>
                  )}
                </span>
              </label>
            </div>

            {/* Address Form */}
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="province-select">
                Tỉnh/Thành phố<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  id="province-select"
                  title="Tỉnh/Thành phố"
                  className={styles.input}
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(Number(e.target.value));
                    setSelectedDistrict(0);
                    setSelectedWard(0);
                    setAddressError("");
                  }}
                  disabled={loading}
                >
                  <option value={0}>
                    -- Chọn Tỉnh/Thành phố (
                    {useApiV2 ? "34 tỉnh 2025" : "63 tỉnh"}) --
                  </option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!useApiV2 && (
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="district-select">
                  Quận/Huyện<span>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <select
                    id="district-select"
                    title="Quận/Huyện"
                    className={styles.input}
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(Number(e.target.value));
                      setSelectedWard(0);
                      setAddressError("");
                    }}
                    disabled={loading || !selectedProvince}
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
              <label className={styles.label} htmlFor="ward-select">
                Phường/Xã<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  id="ward-select"
                  title="Phường/Xã"
                  className={styles.input}
                  value={selectedWard}
                  onChange={(e) => {
                    setSelectedWard(Number(e.target.value));
                    setAddressError("");
                  }}
                  disabled={
                    loading ||
                    (useApiV2 ? !selectedProvince : !selectedDistrict)
                  }
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
                  className={styles.input}
                  placeholder="Số 123, Đường ABC"
                  value={street}
                  onChange={(e) => {
                    setStreet(e.target.value);
                    setAddressError("");
                  }}
                />
              </div>
            </div>

            {/* Preview */}
            {(selectedProvince > 0 || street) && (
              <div className={styles.addressPreview}>
                <strong>Địa chỉ xem trước:</strong>
                <div>{buildFullAddress() || "(chưa đầy đủ)"}</div>
              </div>
            )}

            {/* Error Message */}
            {addressError && (
              <div className={styles.errorMessage}>{addressError}</div>
            )}

            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="editDefaultAddress"
                checked={newAddress.is_default}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, is_default: e.target.checked })
                }
              />
              <label htmlFor="editDefaultAddress">
                Đặt làm địa chỉ mặc định
              </label>
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setShowAddressModal(false);
                  setEditingAddressIndex(null);
                }}
                type="button"
              >
                Hủy
              </button>
              <button
                className={styles.btnPrimary}
                onClick={saveAddress}
                type="button"
              >
                {editingAddressIndex !== null ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Modal */}
      {showBankModal && (
        <div className={styles.modal} onClick={() => setShowBankModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>
              {editingBankIndex !== null
                ? "Sửa tài khoản ngân hàng"
                : "Thêm tài khoản ngân hàng"}
            </h3>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Tên ngân hàng<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="VD: Vietcombank, Techcombank..."
                  value={newBank.bank_name}
                  onChange={(e) =>
                    setNewBank({ ...newBank, bank_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Số tài khoản<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="123456789"
                  value={newBank.account_number}
                  onChange={(e) =>
                    setNewBank({ ...newBank, account_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                Tên chủ tài khoản<span>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="NGUYEN VAN A"
                  value={newBank.account_holder}
                  onChange={(e) =>
                    setNewBank({ ...newBank, account_holder: e.target.value })
                  }
                />
              </div>
            </div>

            <div className={styles.checkbox}>
              <input
                type="checkbox"
                id="editDefaultBank"
                checked={newBank.is_default}
                onChange={(e) =>
                  setNewBank({ ...newBank, is_default: e.target.checked })
                }
              />
              <label htmlFor="editDefaultBank">
                Đặt làm tài khoản mặc định
              </label>
            </div>

            <div className={styles.modalButtons}>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setShowBankModal(false);
                  setEditingBankIndex(null);
                }}
                type="button"
              >
                Hủy
              </button>
              <button
                className={styles.btnPrimary}
                onClick={saveBank}
                type="button"
              >
                {editingBankIndex !== null ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfilePage;
