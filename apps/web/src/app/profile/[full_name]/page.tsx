"use client";
import { useRouter } from "next/navigation";
import styleUser from "@/styles/pages/profile/user.module.css";
import { useEffect, useState } from "react";
import Image from "next/image";

const Home = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number: string;
    address: string;
    description: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    // chạy ở client sau khi render
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!mounted) return null;

  //Đăng xuất
  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };
  //Chỉnh sủa thông tin cá nnhân
  const handleEdit = () => {
    router.push("/user/" + user?.full_name + "/edit");
  };

  //Đổi mật khẩu
  const handleChangePassword = () => {
    router.push("/user/" + user?.full_name + "/changePassword");
  };

  return (
    <div className={styleUser["container"]}>
      <div className={styleUser["gradientBorder"]}>
        <div className={styleUser["card"]}>
          <div className={styleUser["cardAvatarBackground"]}>
            {user?.avatar ? (
              <Image
                src={process.env.NEXT_PUBLIC_URL_GCS + user.avatar}
                alt=""
                className={styleUser["avatarImg"]}
                width={120}
                height={120}
              />
            ) : (
              <Image
                src="/image/header/carbon_user-avatar-filled-alt.svg"
                alt=""
                className={styleUser["avatarImg"]}
                width={120}
                height={120}
              />
            )}
          </div>

          <div>
            <p className={styleUser["title"]}>{user?.full_name}</p>
          </div>

          <div className={styleUser["cardAllInfo"]}>
            <div className={styleUser["cardInfo"]}>
              <Image
                src="/image/profile/mail.svg"
                alt=""
                className={styleUser["iconImg"]}
                width={16}
                height={16}
              />
              <p className={styleUser["bold"]}>Email: </p>
              <p className={styleUser[""]}>{user?.email}</p>
            </div>

            <div className={styleUser["cardInfo"]}>
              <Image
                src="/image/profile/phone.svg"
                alt=""
                className={styleUser["iconImg"]}
                width={16}
                height={16}
              />
              <p className={styleUser["bold"]}>Số điện thoại: </p>
              {user?.phone_number ? (
                <p className={styleUser[""]}>{user?.phone_number}</p>
              ) : (
                <p className={styleUser[""]}>đang cập nhật</p>
              )}
            </div>

            <div className={styleUser["cardInfo"]}>
              <Image
                src="/image/profile/map.svg"
                alt=""
                className={styleUser["iconImg"]}
                width={16}
                height={16}
              />
              <p className={styleUser["bold"]}>Địa chỉ: </p>
              {user?.address ? (
                <p className={styleUser[""]}>{user?.address}</p>
              ) : (
                <p className={styleUser[""]}>đang cập nhật</p>
              )}
            </div>

            <div className={styleUser["cardInfo"]}>
              <Image
                src="/image/profile/detail.svg"
                alt=""
                className={styleUser["iconImg"]}
                width={16}
                height={16}
              />
              <p className={styleUser["boldNoWrap"]}>Giới thiệu: </p>
              {user?.description ? (
                <p className={styleUser[""]}> </p>
              ) : (
                <p className={styleUser["wordBreak"]}>đang cập nhật</p>
              )}
            </div>

            <div className={styleUser["cardInfo"]}>
              {user?.description ? (
                <p className={styleUser[""]}>{user?.description}</p>
              ) : (
                <p className={styleUser["describe"]}>
                  
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              className={styleUser["btnProfile"]}
              onClick={() => handleEdit()}
            >
              <p className={styleUser["textBtn"]}>Chỉnh sửa trang cá nhân</p>
            </button>
          </div>

          <div>
            <button
              className={styleUser["btnProfile"]}
              onClick={() => handleChangePassword()}
            >
              <p className={styleUser["textBtn"]}>Đổi mật khẩu</p>
            </button>
          </div>

          <div className={styleUser["gradientBorderLogout"]}>
            <button
              className={styleUser["btnLogout"]}
              onClick={() => handleLogout()}
            >
              <p className={styleUser["textBtn"]}>Đăng xuất</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
