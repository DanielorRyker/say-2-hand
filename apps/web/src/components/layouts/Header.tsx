"use client";
import NavDropdown from "react-bootstrap/NavDropdown";
// import "@/styles/globals.scss";
import headerStyles from "@/styles/layout/header.module.scss";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import NotificationPopup from "@/app/notification/NotificationPopup";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { Icon } from "@iconify/react";

const Header = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    avatar: string;
  } | null>(null);

  useEffect(() => {
    // chạy ở client sau khi render
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Xử lý scroll để thay đổi header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Xử lý search
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const handleBtn = () => {
    router.push("/auth/login");
  };

  const [selectedItem, setSelectedItem] = useState("Tp. Hồ Chí Minh"); // Tiêu đề ban đầu

  const handleSelect = (value: string) => {
    setSelectedItem(value);
  };
  //Conversation
  interface IConversation {
    _id: string;
    post_id: {
      _id: string;
      title: string;
      images: {
        _id: string;
        url: string;
        alt?: string;
        tags: string[];
      }[];
    };
    participants: {
      _id: string;
      full_name: string;
      avatar?: string;
    }[];
    last_message?: {
      text: string;
      sender_id?: {
        _id: string;
        full_name: string;
        avatar: string;
      };
      created_at: string;
    };
    updatedAt: string;
    unreadCount: number;
  }
  const [conversationsData, setConversationsData] = useState<IConversation[]>(
    []
  );
  // API lấy danh sách
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get(
        `http://localhost:8080/api/conversations/conversations/${user._id}`
      );
      setConversationsData(res.data);
    } catch (err) {
      console.error("Lỗi fetch conversations:", err);
    }
  }, [user]);
  // Lần đầu load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Socket connect
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    // Kết nối socket.io tới BE (NestJS WebSocketGateway)
    const newSocket = io("http://localhost:8080", {
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from socket");
    });

    // cleanup khi unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);
  // Lắng nghe receive_message => reload API
  useEffect(() => {
    if (!socket || !user?._id) return;

    socket.emit("join_user", { userId: user._id });

    const handleUpdate = (data: any) => {
      console.log(" Có tin nhắn mới tới phòng khác:", data);
      // chỉ cần fetch lại danh sách hội thoại để cập nhật unreadCount
      fetchConversations();
    };

    socket.on("conversation_updated", handleUpdate);

    return () => {
      socket.off("conversation_updated", handleUpdate);
    };
  }, [socket, user?._id]);

  //tổng tin chưa đọc
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const count = conversationsData.reduce(
      (acc, conv) => acc + (conv.unreadCount ?? 0),
      0
    );
    setTotalUnread(count);
  }, [conversationsData]);

  //Đăng xuất
  const handleLogout = () => {
    // Xóa toàn bộ localStorage
    localStorage.clear();
    router.push("/auth/login");
  };
  //Đăng ký
  const handleRegister = () => {
    // Xóa toàn bộ localStorage

    router.push("/auth/register");
  };
  // Thông tin cá nhân
  const handleProfile = () => {
    // Xóa toàn bộ localStorage

    router.push("/profile/" + user?.full_name);
  };
  //Mở trang favories
  const handlerFavorites = () => {
    const sortBy = "favorites";
    localStorage.setItem("sortBy", sortBy);
    router.push(`/${sortBy}`);
  };
  //Mở trang bài đăng của tôi
  const handleMyPost = () => {
    const sortBy = "myPost";
    localStorage.setItem("sortBy", sortBy);
    router.push(`/${sortBy}`);
  };
  //Mở trang tin nhắn
  const handleMessage = () => {
    localStorage.setItem("conversation", JSON.stringify(conversationsData[0]));
    router.push(`/conversation/${conversationsData[0]._id}`);
  };

  const avatarUrl = user
    ? process.env.NEXT_PUBLIC_URL_GCS + user.avatar
    : "/image/header/carbon_user-avatar-filled-alt.svg";

  return (
    <div
      className={`${headerStyles.headerContainer} ${scrolled ? headerStyles.scrolled : ""}`}
    >
      <div className={headerStyles.flexRow}>
        <div className={headerStyles.group1}>
          <NavDropdown
            className={headerStyles.dropDownCar}
            title={
              <Image
                src="/image/header/pajamas_hamburger.svg"
                alt="Menu"
                width={32}
                height={32}
                className={headerStyles.img}
              />
            }
            id="basic-nav-dropdown"
          >
            <NavDropdown.Item href="#action/1">
              <h5>Danh mục</h5>
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item href="#action/1">Xe cộ</NavDropdown.Item>
            <NavDropdown.Item href="#action/2">Đồ điện tử</NavDropdown.Item>
            <NavDropdown.Item href="#action/3">Thú cưng</NavDropdown.Item>
            <NavDropdown.Item href="#action/3">Mẹ và bé</NavDropdown.Item>
            <NavDropdown.Item href="#action/3">Đồ gia dụng</NavDropdown.Item>
            <NavDropdown.Item href="#action/3">Sách </NavDropdown.Item>
          </NavDropdown>
          <button
            onClick={() => router.push("/home")}
            className={headerStyles.logoButton}
            title="Về trang chủ"
          >
            <Image
              src="/image/header/Say2Hand.svg"
              alt="Logo"
              width={200}
              height={45}
              className={headerStyles.logoImg}
              style={{ width: "auto", height: "auto" }}
            />
          </button>
        </div>

        {/* Search bar - hiển thị trong header chính */}
        <div className={headerStyles.searchContainer}>
          <div className={headerStyles.searchInputGroup}>
            <Icon
              icon="mdi:magnify"
              width={22}
              height={22}
              className={headerStyles.searchIcon}
            />
            <form onSubmit={handleSearch} className={headerStyles.searchForm}>
              <input
                type="text"
                className={headerStyles.inputSearch}
                placeholder="Tìm kiếm sản phẩm, đồ cũ, trao đổi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {searchQuery && (
              <button
                type="button"
                className={headerStyles.clearSearchBtn}
                onClick={() => setSearchQuery("")}
                title="Xóa tìm kiếm"
                aria-label="Xóa tìm kiếm"
              >
                <Icon icon="mdi:close-circle" width={20} height={20} />
              </button>
            )}
            <div className={headerStyles.searchDivider}></div>
            <div className={headerStyles.locationDropDownWrapper}>
              <NavDropdown
                className={headerStyles.locationDropDown}
                title={
                  <span className={headerStyles.headerLocationDropdown}>
                    <Icon
                      icon="mdi:map-marker"
                      width={18}
                      height={18}
                      className={headerStyles.locationIcon}
                    />
                    <span className={headerStyles.headerLocationText}>
                      {selectedItem}
                    </span>
                    <Icon
                      icon="mdi:chevron-down"
                      width={16}
                      height={16}
                      className={headerStyles.dropdownArrow}
                    />
                  </span>
                }
                id="location-nav-dropdown"
              >
                <NavDropdown.Item onClick={() => handleSelect("Hà Nội")}>
                  <Icon
                    icon="mdi:map-marker-outline"
                    width={16}
                    height={16}
                    style={{ marginRight: "8px" }}
                  />
                  Hà Nội
                </NavDropdown.Item>
                <NavDropdown.Item
                  onClick={() => handleSelect("Tp. Hồ Chí Minh")}
                >
                  <Icon
                    icon="mdi:map-marker-outline"
                    width={16}
                    height={16}
                    style={{ marginRight: "8px" }}
                  />
                  Tp. Hồ Chí Minh
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => handleSelect("Vĩnh Long")}>
                  <Icon
                    icon="mdi:map-marker-outline"
                    width={16}
                    height={16}
                    style={{ marginRight: "8px" }}
                  />
                  Vĩnh Long
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => handleSelect("Cần Thơ")}>
                  <Icon
                    icon="mdi:map-marker-outline"
                    width={16}
                    height={16}
                    style={{ marginRight: "8px" }}
                  />
                  Cần Thơ
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => handleSelect("Thanh Hóa")}>
                  <Icon
                    icon="mdi:map-marker-outline"
                    width={16}
                    height={16}
                    style={{ marginRight: "8px" }}
                  />
                  Thanh Hóa
                </NavDropdown.Item>
              </NavDropdown>
            </div>
            <button
              className={headerStyles.searchButton}
              onClick={handleSearch}
              type="button"
              title="Tìm kiếm"
              aria-label="Tìm kiếm"
            >
              <Icon icon="mdi:magnify" width={24} height={24} />
              <span className={headerStyles.searchButtonText}>Tìm</span>
            </button>
          </div>
        </div>

        <div className={headerStyles.group2}>
          <button
            className={headerStyles.btnHeader}
            type="button"
            title="Yêu thích"
            aria-label="Yêu thích"
            onClick={handlerFavorites}
          >
            <Image
              src="/image/header/Favourite icon.svg"
              alt="Yêu thích"
              className={headerStyles.img}
              width={24}
              height={24}
            />
          </button>

          <button
            className={headerStyles.btnHeader}
            type="button"
            title="Tin nhắn"
            aria-label="Tin nhắn"
            onClick={handleMessage}
          >
            <Image
              src="/image/header/IconMessage.svg"
              alt="Tin nhắn"
              className={headerStyles.img}
              width={24}
              height={24}
            />
            {totalUnread == 0 ? (
              <div></div>
            ) : (
              <div className={headerStyles.unreadCount}>{totalUnread}</div>
            )}
          </button>

         
            <NotificationPopup/>
          {user ? (
            <>
              <button
                className={headerStyles.btnLogin}
                onClick={() => router.push("/post/createPost")}
              >
                <p className={headerStyles.headerBtnText}>Đăng tin</p>
              </button>
            </>
          ) : (
            <button
              className={headerStyles.btnLogin}
              onClick={() => handleBtn()}
            >
              <p className={headerStyles.headerBtnText}>Đăng nhập</p>
            </button>
          )}
          <NavDropdown
            className={headerStyles.userDropDown}
            title={
              <span className={headerStyles.headerUserDropdown}>
                <Image
                  src={
                    user?.avatar
                      ? process.env.NEXT_PUBLIC_URL_GCS + user.avatar
                      : "/image/header/carbon_user-avatar-filled-alt.svg"
                  }
                  alt=""
                  className={headerStyles.imgAvatar}
                  width={32}
                  height={32}
                />
                <Image
                  src="/image/header/arrow-down.svg"
                  alt=""
                  className={headerStyles.img}
                  width={16}
                  height={16}
                />
              </span>
            }
            id="basic-nav-dropdown"
          >
            {/* Nếu chưa login thì hiện Đăng nhập + Đăng ký */}
            {!user && (
              <>
                <NavDropdown.Item onClick={handleLogout}>
                  Đăng nhập
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleRegister}>
                  Đăng ký
                </NavDropdown.Item>
              </>
            )}

            {/* Nếu có user thì hiện Cài đặt tài khoản + Đăng xuất */}
            {user && user.role === "user" && (
              <>
                <NavDropdown.Item onClick={handleProfile}>
                  Cài đặt tài khoản
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleMyPost}>
                  Bài đăng của tôi
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Đăng xuất
                </NavDropdown.Item>
              </>
            )}
            {user && user.role === "admin" && (
              <>
                <NavDropdown.Item onClick={handleProfile}>
                  Cài đặt tài khoản
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => router.push("/admin/users")}>
                  Quản lý tài khoản
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => router.push("/admin/posts")}>
                  Quản lý bài đăng
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={() => router.push("/admin/categories")}
                >
                  Quản lý danh mục
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Đăng xuất
                </NavDropdown.Item>
              </>
            )}
          </NavDropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;
