"use client";
import NavDropdown from "react-bootstrap/NavDropdown";
// import "@/styles/globals.scss";
import headerStyles from "./header.module.scss";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import NotificationPopup from "@/app/notification/NotificationPopup";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { Icon } from "@iconify/react";
import { API_BASE, formatImageUrl } from "@/lib/constants";

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

  // useEffect(() => {
  //   // chạy ở client sau khi render
  //   const storedUser = localStorage.getItem("user");
  //   if (storedUser) {
  //     setUser(JSON.parse(storedUser));
  //   }
  // }, []);

  useEffect(() => {
    const loadUser = () => {
      const s = localStorage.getItem("user");
      setUser(s ? JSON.parse(s) : null);
    };
    loadUser();

    const onUserUpdated = () => {
      // nếu dispatch CustomEvent với detail thì dùng (e as CustomEvent).detail
      loadUser();
    };
    window.addEventListener("user-updated", onUserUpdated);
    return () => window.removeEventListener("user-updated", onUserUpdated);
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
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());

    if (selectedProvince) {
      // ✅ Navigate ngay, không cần AI normalization ở Header
      // AI sẽ được xử lý ở search page khi cần filter
      params.set("province", selectedProvince.name);
      params.set("provinceCode", String(selectedProvince.code));
    }

    const query = params.toString();
    router.push(`/search${query ? `?${query}` : ""}`);
  };

  const handleBtn = () => {
    router.push("/auth/login");
  };

  const [selectedItem, setSelectedItem] = useState("Đang xác định..."); // Tiêu đề ban đầu
  const [selectedProvince, setSelectedProvince] = useState<{
    code: number;
    name: string;
  } | null>(null);
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>(
    []
  );
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [provincesError, setProvincesError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [provinceCounts, setProvinceCounts] = useState<Record<string, number>>(
    {}
  );

  // helper to select a province (chỉ select, không navigate)
  const handleSelectProvince = (p: { code: number; name: string }) => {
    setSelectedItem(p.name);
    setSelectedProvince({ code: p.code, name: p.name });

    try {
      localStorage.setItem(
        "selectedProvince",
        JSON.stringify({ code: p.code, name: p.name })
      );
    } catch {
      // ignore
    }
  };

  // Load persisted selected province from localStorage (store as JSON {code,name})
  useEffect(() => {
    try {
      const stored = localStorage.getItem("selectedProvince");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          setSelectedItem(parsed.name);
          setSelectedProvince({ code: parsed.code, name: parsed.name });
          return; // Đã có province được lưu, không cần lấy vị trí hiện tại
        }
      }
    } catch {
      // ignore
    }

    // Nếu chưa có province được lưu, lấy vị trí hiện tại
    if ("geolocation" in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // ✅ Reverse geocoding với Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const address = data.address || {};

            // ✅ Xây dựng địa chỉ tiếng Việt để gửi cho AI
            const vietnameseAddressParts = [
              address.road,
              address.suburb || address.neighbourhood || address.quarter,
              address.city || address.town || address.village,
              address.county,
              address.state || address.province,
              address.country === "Việt Nam" ? "Việt Nam" : address.country,
            ].filter(Boolean);

            const enhancedAddress =
              vietnameseAddressParts.length > 0
                ? vietnameseAddressParts.join(", ")
                : data.display_name || "";

            // ✅ Gọi AI để normalize theo cấu trúc VN 2025
            try {
              console.log(
                "📍 Header: Calling AI with address:",
                enhancedAddress
              );
              const aiResponse = await axios.post(
                `${API_BASE}/api/gemini/normalize-address`,
                {
                  address: enhancedAddress,
                  lat: latitude,
                  lon: longitude,
                }
              );

              console.log("📍 Header: AI response:", aiResponse.data);

              if (aiResponse.data && aiResponse.data.province) {
                // ✅ Dùng kết quả từ AI (chuẩn xác với cấu trúc 2025)
                console.log(
                  "📍 Header: Setting province from AI:",
                  aiResponse.data.province
                );
                setSelectedItem(aiResponse.data.province);
                setIsGettingLocation(false);
                return;
              }
            } catch (aiError) {
              console.warn("⚠️ Header AI normalization failed:", aiError);
              // Fallback to Nominatim below
            }

            // ⚠️ Fallback: Dùng Nominatim nếu AI thất bại
            const provinceName =
              address.state ||
              address.province ||
              address.county ||
              address.city ||
              "Việt Nam";

            setSelectedItem(provinceName);
            setIsGettingLocation(false);
          } catch (error) {
            console.error("Failed to get location:", error);
            setSelectedItem("Việt Nam");
            setIsGettingLocation(false);
          }
        },
        (error) => {
          // Xử lý lỗi geolocation trong Header (silent, không làm phiền user)
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.warn(
                "⚠️ Header geolocation: Permission denied, using default 'Việt Nam'"
              );
              break;
            case error.POSITION_UNAVAILABLE:
              console.warn(
                "⚠️ Header geolocation: Position unavailable, using default 'Việt Nam'"
              );
              break;
            case error.TIMEOUT:
              console.warn(
                "⚠️ Header geolocation: Timeout, using default 'Việt Nam'"
              );
              break;
            default:
              console.warn(
                "⚠️ Header geolocation unknown error:",
                error.message || error
              );
              break;
          }

          // Fallback to default "Việt Nam" (silent, không hiện alert)
          setSelectedItem("Việt Nam");
          setIsGettingLocation(false);
        }
      );
    } else {
      setSelectedItem("Việt Nam");
    }
  }, []);

  // Fetch provinces list from open API
  useEffect(() => {
    let mounted = true;
    const fetchProvinces = async () => {
      setProvincesLoading(true);
      setProvincesError(null);
      try {
        const res = await axios.get("https://provinces.open-api.vn/api/v2/");
        if (!mounted) return;
        // API returns array of {code, name, division_type, codename, phone_code}
        const mapped = (res.data || []).map((p: any) => ({
          code: p.code,
          name: p.name,
        }));
        setProvinces(mapped);

        // ✅ Nếu selectedItem đã được set từ geolocation (AI-normalized), tìm code tương ứng
        console.log(
          "📍 Header: Provinces loaded, selectedItem:",
          selectedItem,
          "selectedProvince:",
          selectedProvince
        );

        if (
          selectedItem &&
          selectedItem !== "Đang xác định..." &&
          selectedItem !== "Việt Nam"
        ) {
          // Helper để normalize text cho việc so sánh
          const normalizeForMatch = (text: string) =>
            text
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[đĐ]/g, "d")
              .trim();

          const normalizedSelected = normalizeForMatch(selectedItem);

          console.log("📍 Header: Trying to match:", normalizedSelected);

          // Thử exact match trước
          let matchedProvince = mapped.find(
            (p: any) => normalizeForMatch(p.name) === normalizedSelected
          );

          console.log("📍 Header: Exact match result:", matchedProvince);

          // Nếu không có exact match, thử contains
          if (!matchedProvince) {
            matchedProvince = mapped.find(
              (p: any) =>
                normalizeForMatch(p.name).includes(normalizedSelected) ||
                normalizedSelected.includes(normalizeForMatch(p.name))
            );
            console.log("📍 Header: Contains match result:", matchedProvince);
          }

          if (matchedProvince && !selectedProvince) {
            const matched = {
              code: matchedProvince.code,
              name: matchedProvince.name,
            };
            console.log("📍 Header: Setting matched province:", matched);
            setSelectedProvince(matched);
            setSelectedItem(matchedProvince.name);

            // ✅ Lưu vào localStorage để lần sau không cần gọi geolocation nữa
            try {
              localStorage.setItem("selectedProvince", JSON.stringify(matched));
              console.log("📍 Header: Saved to localStorage:", matched);
            } catch {
              // ignore localStorage errors
            }
          }
        }

        // try to fetch post counts per province from backend
        try {
          const countsRes = await axios.get(
            `${API_BASE}/api/posts/counts/province`
          );
          const countsArr: { province: string | null; count: number }[] =
            countsRes.data || [];
          const map: Record<string, number> = {};
          countsArr.forEach((c) => {
            if (c.province) map[c.province] = c.count;
          });
          setProvinceCounts(map);
        } catch (err) {
          // ignore if backend endpoint not available
          console.debug(
            "Failed to fetch province counts",
            (err as any)?.message || err
          );
        }
      } catch (err: any) {
        console.error("Failed to fetch provinces", err);
        if (mounted) setProvincesError(String(err?.message || err));
      } finally {
        if (mounted) setProvincesLoading(false);
      }
    };

    fetchProvinces();

    return () => {
      mounted = false;
    };
  }, [selectedItem, selectedProvince]);

  // Categories for header dropdown
  interface Category {
    _id: string;
    name?: string;
    slug?: string;
    image?: string;
    parent_id?: string | null;
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/categories/`);
        if (!mounted) return;
        setCategories(res.data || []);
      } catch (err: any) {
        console.error("Failed to fetch categories", err?.message || err);
        if (mounted) setCategoriesError(String(err?.message || err));
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);
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
        `${API_BASE}/api/conversations/conversations/${user._id}`
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
    const newSocket = io(API_BASE, {
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

  useEffect(() => {
    if (socket && user?._id) {
      console.log("Joining user socket room:", user._id);
      socket.emit("join_user", { userId: user._id });
    }
  }, [socket, user?._id]);

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
  }, [socket, user?._id, fetchConversations]);

  // Tổng số tin nhắn chưa đọc, đồng bộ với localStorage (để nhận realtime từ page.tsx)
  const [totalUnread, setTotalUnread] = useState(0);
  // Hàm lấy số chưa đọc từ localStorage
  const getTotalUnread = () => {
    const val = localStorage.getItem("totalUnread");
    return val ? parseInt(val, 10) : 0;
  };
  
  useEffect(() => {
    setTotalUnread(getTotalUnread());
    // Lắng nghe cả sự kiện storage (đa tab) và custom event (cùng tab)
    const handleStorage = () => {
      setTotalUnread(getTotalUnread());
    };
    const handleCustom = () => {
      setTotalUnread(getTotalUnread());
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("unread-message-updated", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("unread-message-updated", handleCustom);
    };
  }, []);
  // Khi conversationsData thay đổi (nếu có fetch lại), cũng cập nhật lại
  // useEffect(() => {
  //   setTotalUnread(getTotalUnread());
  // }, [conversationsData]);
  //   useEffect(() => {
  //   const count = conversationsData.reduce(
  //     (acc, conv) => acc + (conv.unreadCount ?? 0),
  //     0
  //   );
  //   setTotalUnread(count);
  // }, [conversationsData]);

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

  //Mở trang quản lý đơn hàng (đã bán)
  const handleOrders = () => {
    router.push("/orders");
  };

  //Mở trang quản lý đơn mua
  const handleMyOrders = () => {
    router.push("/my-orders");
  };

  //Mở trang tin nhắn
  const handleMessage = () => {
    if (!conversationsData || conversationsData.length === 0) {
      console.warn("No conversations available");
      return;
    }
    const firstConv = conversationsData[0];
    if (!firstConv || !firstConv._id) {
      console.warn("First conversation missing _id", firstConv);
      return;
    }
    localStorage.setItem("conversation", JSON.stringify(firstConv));
    router.push(`/conversation/${firstConv._id}`);
  };

  // avatarUrl removed (unused) — the JSX uses inline expression instead

  return (
    <div
      className={`${headerStyles.headerContainer} ${scrolled ? headerStyles.scrolled : ""}`}
    >
      <div className={headerStyles.flexRow}>
        <div className={headerStyles.group1}>
          <button
            onClick={() => router.push("/home")}
            className={headerStyles.logoButton}
            title="Về trang chủ"
          >
            {/* Logo desktop */}
            <img
              src="/image/header/Say2hand.svg"
              alt="Logo"
              width={200}
              height={45}
              className={headerStyles.logoImg}
              draggable={false}
            />
            {/* Logo mobile */}
            <img
              src="/image/header/Say2hand.svg"
              alt="Logo Mobile"
              width={140}
              height={36}
              className={headerStyles.logoMobile}
              draggable={false}
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
                <div className={headerStyles.provinceList}>
                  {provincesLoading && (
                    <NavDropdown.Item disabled>Đang tải...</NavDropdown.Item>
                  )}
                  {provincesError && (
                    <NavDropdown.Item disabled>Lỗi tải tỉnh</NavDropdown.Item>
                  )}
                  {!provincesLoading &&
                    !provincesError &&
                    provinces.length === 0 && (
                      <NavDropdown.Item disabled>
                        Không có dữ liệu
                      </NavDropdown.Item>
                    )}

                  {provinces.map((p) => (
                    <NavDropdown.Item
                      key={p.code}
                      onClick={() => handleSelectProvince(p)}
                    >
                      <Icon icon="mdi:map-marker" width={16} height={16} />
                      <span className="dropdown-item-label">{p.name}</span>
                    </NavDropdown.Item>
                  ))}
                </div>
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

          <NotificationPopup />
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
              <div className={headerStyles.headerUserDropdown}>
                <Image
                  src={
                    user?.avatar
                      ? formatImageUrl(user.avatar) ||
                        "/image/header/carbon_user-avatar-filled-alt.svg"
                      : "/image/header/carbon_user-avatar-filled-alt.svg"
                  }
                  alt=""
                  className={headerStyles.imgAvatar}
                  width={32}
                  height={32}
                />
              </div>
            }
            id="basic-nav-dropdown"
          >
            {/* Nếu chưa login thì hiện Đăng nhập + Đăng ký */}
            {!user && (
              <>
                <NavDropdown.Item onClick={handleLogout}>
                  <Icon icon="mdi:login" width={20} height={20} />
                  Đăng nhập
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleRegister}>
                  <Icon icon="mdi:account-plus" width={20} height={20} />
                  Đăng ký
                </NavDropdown.Item>
              </>
            )}

            {/* Nếu có user thì hiện Cài đặt tài khoản + Đăng xuất */}
            {user && user.role === "user" && (
              <>
                <NavDropdown.Item onClick={handleProfile}>
                  <Icon icon="mdi:account-cog" width={20} height={20} />
                  Cài đặt tài khoản
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleMyPost}>
                  <Icon icon="mdi:post" width={20} height={20} />
                  Bài đăng của tôi
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleOrders}>
                  <Icon icon="mdi:package-variant" width={20} height={20} />
                  Quản lý đơn hàng
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleMyOrders}>
                  <Icon icon="mdi:shopping" width={20} height={20} />
                  Đơn đã mua
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <Icon icon="mdi:logout" width={20} height={20} />
                  Đăng xuất
                </NavDropdown.Item>
              </>
            )}
            {user && user.role === "admin" && (
              <>
                <NavDropdown.Item onClick={handleProfile}>
                  <Icon icon="mdi:account-cog" width={20} height={20} />
                  Cài đặt tài khoản
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => router.push("/admin/users")}>
                  <Icon icon="mdi:account-group" width={20} height={20} />
                  Quản lý tài khoản
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => router.push("/admin/posts")}>
                  <Icon icon="mdi:post-outline" width={20} height={20} />
                  Quản lý bài đăng
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={() => router.push("/admin/categories")}
                >
                  <Icon icon="mdi:shape" width={20} height={20} />
                  Quản lý danh mục
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={() => router.push("/admin/transactions")}
                >
                  <Icon icon="mdi:cash-multiple" width={20} height={20} />
                  Quản lý giao dịch
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <Icon icon="mdi:logout" width={20} height={20} />
                  Đăng xuất
                </NavDropdown.Item>
              </>
            )}
          </NavDropdown>
        </div>
      </div>

      {/* Mobile Search Row - Hiển thị ở hàng riêng trên mobile */}
      <div className={headerStyles.mobileSearchRow}>
        <div className={headerStyles.mobileSearchContainer}>
          <div className={headerStyles.searchInputGroup}>
            <Icon
              icon="mdi:magnify"
              width={20}
              height={20}
              className={headerStyles.searchIcon}
            />
            <form onSubmit={handleSearch} className={headerStyles.searchForm}>
              <input
                type="text"
                className={headerStyles.inputSearch}
                placeholder="Tìm kiếm sản phẩm..."
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
                <Icon icon="mdi:close-circle" width={18} height={18} />
              </button>
            )}
            <button
              className={headerStyles.searchButton}
              onClick={handleSearch}
              type="button"
              title="Tìm kiếm"
              aria-label="Tìm kiếm"
            >
              <Icon icon="mdi:magnify" width={22} height={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
