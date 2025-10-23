"use client";
import { useRouter } from "next/navigation";
import styleProfile from "@/styles/pages/profile/profile-v2.module.scss";
import { useEffect, useState } from "react";
import Image from "next/image";

const ProfilePage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number: string;
    address?: string;
    addresses?: {
      label?: string;
      address: string;
      is_default?: boolean;
    }[];
    description: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Listen for changes to localStorage from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "user") {
        const newVal = e.newValue;
        if (newVal) setUser(JSON.parse(newVal));
      }
    };

    // Custom event for same-tab updates (dispatched from the edit page)
    const handleUserUpdated = () => {
      const fresh = localStorage.getItem("user");
      if (fresh) setUser(JSON.parse(fresh));
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("user-updated", handleUserUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("user-updated", handleUserUpdated);
    };
  }, []);

  if (!mounted) return null;

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };

  const handleEdit = () => {
    router.push("/profile/" + user?.full_name + "/edit");
  };

  const handleChangePassword = () => {
    router.push("/profile/" + user?.full_name + "/changePassword");
  };

  const handleSettings = () => {
    router.push("/profile/settings");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayAddress = (u: typeof user) => {
    if (!u) return null;
    // prefer structured addresses array
    if (u.addresses && u.addresses.length > 0) {
      const def = u.addresses.find((a) => a.is_default);
      const pick = def || u.addresses[0];
      return pick.address || pick.label || null;
    }
    // fallback to old single string field
    return u.address || null;
  };

  return (
    <div className={styleProfile["container"]}>
      <div className={styleProfile["gradientBorder"]}>
        <div className={styleProfile["card"]}>
          {/* Avatar Section */}
          <div className={styleProfile["avatarSection"]}>
            <div className={styleProfile["avatarWrapper"]}>
              {user?.avatar ? (
                <Image
                  src={process.env.NEXT_PUBLIC_URL_GCS + user.avatar}
                  alt="Avatar"
                  className={styleProfile["avatar"]}
                  width={132}
                  height={132}
                />
              ) : (
                <div className={styleProfile["avatarPlaceholder"]}>
                  {getInitials(user?.full_name || "U")}
                </div>
              )}
            </div>
            <div>
              <h1 className={styleProfile["userName"]}>{user?.full_name}</h1>
              <div className={styleProfile["userRole"]}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className={styleProfile["infoSection"]}>
            <div className={styleProfile["infoCard"]}>
              <div className={styleProfile["infoItem"]}>
                <Image
                  src="/image/profile/mail.svg"
                  alt=""
                  className={styleProfile["infoIcon"]}
                  width={20}
                  height={20}
                />
                <span className={styleProfile["infoLabel"]}>Email:</span>
                <span className={styleProfile["infoValue"]}>{user?.email}</span>
              </div>

              <div className={styleProfile["infoItem"]}>
                <Image
                  src="/image/profile/phone.svg"
                  alt=""
                  className={styleProfile["infoIcon"]}
                  width={20}
                  height={20}
                />
                <span className={styleProfile["infoLabel"]}>
                  Số điện thoại:
                </span>
                <span
                  className={
                    user?.phone_number
                      ? styleProfile["infoValue"]
                      : styleProfile["infoEmpty"]
                  }
                >
                  {user?.phone_number || "Đang cập nhật"}
                </span>
              </div>

              <div className={styleProfile["infoItem"]}>
                <Image
                  src="/image/profile/map.svg"
                  alt=""
                  className={styleProfile["infoIcon"]}
                  width={20}
                  height={20}
                />
                <span className={styleProfile["infoLabel"]}>Địa chỉ:</span>
                <span
                  className={
                    getDisplayAddress(user)
                      ? styleProfile["infoValue"]
                      : styleProfile["infoEmpty"]
                  }
                >
                  {getDisplayAddress(user) || "Đang cập nhật"}
                </span>
              </div>

              <div className={styleProfile["infoItem"]}>
                <Image
                  src="/image/profile/detail.svg"
                  alt=""
                  className={styleProfile["infoIcon"]}
                  width={20}
                  height={20}
                />
                <span className={styleProfile["infoLabel"]}>Giới thiệu:</span>
                <span
                  className={
                    user?.description
                      ? styleProfile["infoValue"]
                      : styleProfile["infoEmpty"]
                  }
                >
                  {user?.description || "Đang cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {/* Button Group */}
          <div className={styleProfile["buttonGroup"]}>
            <button
              className={styleProfile["btnPrimary"]}
              onClick={handleEdit}
              type="button"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              Chỉnh sửa trang cá nhân
            </button>

            <button
              className={styleProfile["btnSecondary"]}
              onClick={handleSettings}
              type="button"
            >
              <div className={styleProfile["btnSecondaryInner"]}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                <span className={styleProfile["btnSecondaryText"]}>
                  Cài đặt tài khoản
                </span>
              </div>
            </button>

            <button
              className={styleProfile["btnSecondary"]}
              onClick={handleChangePassword}
              type="button"
            >
              <div className={styleProfile["btnSecondaryInner"]}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                <span className={styleProfile["btnSecondaryText"]}>
                  Đổi mật khẩu
                </span>
              </div>
            </button>

            <div className={styleProfile["divider"]}></div>

            <button
              className={styleProfile["btnLogout"]}
              onClick={handleLogout}
              type="button"
            >
              <div className={styleProfile["btnLogoutInner"]}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                <span className={styleProfile["btnLogoutText"]}>Đăng xuất</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
