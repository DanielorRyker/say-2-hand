"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import NotificationPopup from "@/app/notification/NotificationPopup";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { Icon } from "@iconify/react";
import { API_BASE, formatImageUrl } from "@/lib/constants";
import styles from "./headerMobile.module.scss";

const HeaderMobile = () => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);

  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
    avatar: string;
  } | null>(null);

  // Load user từ localStorage
  useEffect(() => {
    const loadUser = () => {
      const s = localStorage.getItem("user");
      setUser(s ? JSON.parse(s) : null);
    };
    loadUser();

    const onUserUpdated = () => {
      loadUser();
    };
    window.addEventListener("user-updated", onUserUpdated);
    return () => window.removeEventListener("user-updated", onUserUpdated);
  }, []);

  // Xử lý scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Province state
  const [selectedItem, setSelectedItem] = useState("Đang xác định...");
  const [selectedProvince, setSelectedProvince] = useState<{
    code: number;
    name: string;
  } | null>(null);
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>(
    []
  );
  const [provinceCounts, setProvinceCounts] = useState<Record<string, number>>(
    {}
  );
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Helper to select province
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
    setShowLocationModal(false);
  };

  // Load persisted province hoặc lấy vị trí hiện tại
  useEffect(() => {
    try {
      const stored = localStorage.getItem("selectedProvince");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.name) {
          setSelectedItem(parsed.name);
          setSelectedProvince({ code: parsed.code, name: parsed.name });
          return;
        }
      }
    } catch {
      // ignore
    }

    // Lấy vị trí hiện tại
    if ("geolocation" in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const address = data.address || {};

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
        () => {
          setSelectedItem("Việt Nam");
          setIsGettingLocation(false);
        }
      );
    } else {
      setSelectedItem("Việt Nam");
    }
  }, []);

  // Fetch provinces
  useEffect(() => {
    let mounted = true;
    const fetchProvinces = async () => {
      setProvincesLoading(true);
      try {
        const res = await axios.get("https://provinces.open-api.vn/api/v2/"); // Sử dụng HTTPS để tránh lỗi Mixed Content
        if (!mounted) return;
        const mapped = (res.data || []).map((p: any) => ({
          code: p.code,
          name: p.name,
        }));
        setProvinces(mapped);

        if (
          selectedItem &&
          selectedItem !== "Đang xác định..." &&
          selectedItem !== "Việt Nam"
        ) {
          const normalizeForMatch = (text: string) =>
            text
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[đĐ]/g, "d")
              .trim();

          const normalizedSelected = normalizeForMatch(selectedItem);
          let matchedProvince = mapped.find(
            (p: any) => normalizeForMatch(p.name) === normalizedSelected
          );

          if (!matchedProvince) {
            matchedProvince = mapped.find((p: any) =>
              normalizeForMatch(p.name).includes(normalizedSelected)
            );
          }

          if (matchedProvince && !selectedProvince) {
            setSelectedProvince({
              code: matchedProvince.code,
              name: matchedProvince.name,
            });
            try {
              localStorage.setItem(
                "selectedProvince",
                JSON.stringify({
                  code: matchedProvince.code,
                  name: matchedProvince.name,
                })
              );
            } catch {
              // ignore
            }
          }
        }

        // Fetch post counts
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
          console.debug("Failed to fetch province counts", err);
        }
      } catch (err: any) {
        console.error("Failed to fetch provinces", err);
      } finally {
        if (mounted) setProvincesLoading(false);
      }
    };

    fetchProvinces();
    return () => {
      mounted = false;
    };
  }, [selectedItem, selectedProvince]);

  // Categories
  interface Category {
    _id: string;
    name?: string;
    slug?: string;
    image?: string;
    parent_id?: string | null;
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/categories/`);
        if (!mounted) return;
        setCategories(res.data || []);
      } catch (err: any) {
        console.error("Failed to fetch categories", err?.message || err);
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

  // Conversations
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

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Socket
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    const newSocket = io(API_BASE, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket:", newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("join_user", { userId: user._id });
    }
  }, [socket, user?._id]);

  useEffect(() => {
    if (!socket || !user?._id) return;

    socket.emit("join_user", { userId: user._id });

    const handleUpdate = (data: any) => {
      console.log("Có tin nhắn mới:", data);
      fetchConversations();
    };

    socket.on("conversation_updated", handleUpdate);

    return () => {
      socket.off("conversation_updated", handleUpdate);
    };
  }, [socket, user?._id, fetchConversations]);

  // Total unread messages
  const [totalUnread, setTotalUnread] = useState(0);
  const getTotalUnread = () => {
    const val = localStorage.getItem("totalUnread");
    return val ? parseInt(val, 10) : 0;
  };

  useEffect(() => {
    setTotalUnread(getTotalUnread());
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

  useEffect(() => {
    setTotalUnread(getTotalUnread());
  }, [conversationsData]);

  // Xử lý search
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());

    if (selectedProvince) {
      params.set("province", selectedProvince.name);
      params.set("provinceCode", String(selectedProvince.code));
    }

    const query = params.toString();
    router.push(`/search${query ? `?${query}` : ""}`);
    setShowSearchModal(false);
  };

  // Handlers
  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/login");
    setShowMenuDrawer(false);
  };

  const handleRegister = () => {
    router.push("/auth/register");
  };

  const handleProfile = () => {
    router.push("/profile/" + user?.full_name);
    setShowMenuDrawer(false);
  };

  const handlerFavorites = () => {
    const sortBy = "favorites";
    localStorage.setItem("sortBy", sortBy);
    router.push(`/${sortBy}`);
    setShowMenuDrawer(false);
  };

  const handleMyPost = () => {
    const sortBy = "myPost";
    localStorage.setItem("sortBy", sortBy);
    router.push(`/${sortBy}`);
    setShowMenuDrawer(false);
  };

  const handleOrders = () => {
    router.push("/orders");
    setShowMenuDrawer(false);
  };

  const handleMyOrders = () => {
    router.push("/my-orders");
    setShowMenuDrawer(false);
  };

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
    setShowMenuDrawer(false);
  };

  const handleCategoryClick = (category: Category) => {
    router.push(`/search?category=${category.slug || category._id}`);
    setShowCategoryDrawer(false);
  };

  // Filter provinces
  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(provinceQuery.toLowerCase())
  );

  return (
    <>
      {/* Top Bar */}
      <div
        className={`${styles.mobileHeader} ${scrolled ? styles.scrolled : ""}`}
      >
        <div className={styles.topBar}>
          {/* Logo */}
          <button
            className={styles.logoButton}
            onClick={() => router.push("/")}
          >
            <Image
              src="/image/header/Say2handT.svg"
              alt="Say2Hand Logo"
              width={120}
              height={32}
              className={styles.logo}
            />
          </button>

          {/* Actions */}
          <div className={styles.topActions}>
            {/* Search Button */}
            <button
              className={styles.iconBtn}
              onClick={() => setShowSearchModal(true)}
            >
              <Icon icon="mdi:magnify" width={24} height={24} />
            </button>

            {/* Notification */}
            <div className={styles.iconBtn}>
              <NotificationPopup />
            </div>

            {/* Messages */}
            {user && (
              <button className={styles.iconBtn} onClick={handleMessage}>
                <Icon icon="mdi:message-outline" width={24} height={24} />
                {totalUnread > 0 && (
                  <span className={styles.badge}>{totalUnread}</span>
                )}
              </button>
            )}

            {/* Menu/User */}
            {user ? (
              <button
                className={styles.avatarBtn}
                onClick={() => setShowMenuDrawer(true)}
              >
                <Image
                  src={
                    formatImageUrl(user.avatar) || "/image/header/avatar.jpg"
                  }
                  alt={user.full_name}
                  width={36}
                  height={36}
                  className={styles.avatar}
                />
              </button>
            ) : (
              <button
                className={styles.loginBtn}
                onClick={() => router.push("/auth/login")}
              >
                <Icon icon="mdi:account" width={20} height={20} />
              </button>
            )}
          </div>
        </div>

        {/* Location & Category Bar */}
        <div className={styles.quickBar}>
          <button
            className={styles.quickBtn}
            onClick={() => setShowLocationModal(true)}
          >
            <Icon icon="mdi:map-marker" width={18} height={18} />
            <span className={styles.quickText}>
              {isGettingLocation ? "Đang xác định..." : selectedItem}
            </span>
            <Icon icon="mdi:chevron-down" width={16} height={16} />
          </button>

          <div className={styles.divider} />

          <button
            className={styles.quickBtn}
            onClick={() => setShowCategoryDrawer(true)}
          >
            <Icon icon="mdi:apps" width={18} height={18} />
            <span className={styles.quickText}>Danh mục</span>
          </button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className={styles.modal} onClick={() => setShowSearchModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <button
                className={styles.backBtn}
                onClick={() => setShowSearchModal(false)}
              >
                <Icon icon="mdi:arrow-left" width={24} height={24} />
              </button>
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={() => setSearchQuery("")}
                  >
                    <Icon icon="mdi:close" width={20} height={20} />
                  </button>
                )}
              </form>
              <button
                type="submit"
                className={styles.searchBtn}
                onClick={handleSearch}
              >
                <Icon icon="mdi:magnify" width={24} height={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div
          className={styles.modal}
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className={styles.drawerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Chọn khu vực</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowLocationModal(false)}
              >
                <Icon icon="mdi:close" width={24} height={24} />
              </button>
            </div>

            <div className={styles.searchBox}>
              <Icon icon="mdi:magnify" width={20} height={20} />
              <input
                type="text"
                placeholder="Tìm tỉnh/thành phố..."
                value={provinceQuery}
                onChange={(e) => setProvinceQuery(e.target.value)}
                className={styles.searchBoxInput}
              />
            </div>

            <div className={styles.provinceList}>
              {provincesLoading ? (
                <div className={styles.loading}>Đang tải...</div>
              ) : (
                filteredProvinces.map((p) => (
                  <button
                    key={p.code}
                    className={`${styles.provinceItem} ${
                      selectedProvince?.code === p.code ? styles.active : ""
                    }`}
                    onClick={() => handleSelectProvince(p)}
                  >
                    <Icon icon="mdi:map-marker" width={20} height={20} />
                    <span className={styles.provinceName}>{p.name}</span>
                    {provinceCounts[p.name] && (
                      <span className={styles.count}>
                        {provinceCounts[p.name]}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Drawer */}
      {showCategoryDrawer && (
        <div
          className={styles.modal}
          onClick={() => setShowCategoryDrawer(false)}
        >
          <div
            className={styles.drawerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Danh mục sản phẩm</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowCategoryDrawer(false)}
              >
                <Icon icon="mdi:close" width={24} height={24} />
              </button>
            </div>

            <div className={styles.categoryGrid}>
              {categoriesLoading ? (
                <div className={styles.loading}>Đang tải...</div>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat._id}
                    className={styles.categoryCard}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat.image && formatImageUrl(cat.image) && (
                      <Image
                        src={formatImageUrl(cat.image) as string}
                        alt={cat.name || "Category"}
                        width={48}
                        height={48}
                        className={styles.categoryImage}
                      />
                    )}
                    <span className={styles.categoryName}>{cat.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu Drawer (User Menu) */}
      {showMenuDrawer && (
        <div className={styles.modal} onClick={() => setShowMenuDrawer(false)}>
          <div
            className={styles.drawerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Menu</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowMenuDrawer(false)}
              >
                <Icon icon="mdi:close" width={24} height={24} />
              </button>
            </div>

            {user && (
              <div className={styles.userInfo}>
                <Image
                  src={
                    formatImageUrl(user.avatar) || "/image/header/avatar.jpg"
                  }
                  alt={user.full_name}
                  width={64}
                  height={64}
                  className={styles.userAvatar}
                />
                <div className={styles.userDetails}>
                  <h4 className={styles.userName}>{user.full_name}</h4>
                  <p className={styles.userEmail}>{user.email}</p>
                  {user.role === "admin" && (
                    <div className={styles.adminBadge}>
                      <Icon icon="mdi:crown" width={14} height={14} />
                      <span>Admin</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={styles.menuList}>
              {user && (
                <>
                  <button className={styles.menuItem} onClick={handleProfile}>
                    <Icon icon="mdi:account" width={24} height={24} />
                    <span>Thông tin cá nhân</span>
                  </button>

                  <button className={styles.menuItem} onClick={handleMyPost}>
                    <Icon icon="mdi:post" width={24} height={24} />
                    <span>Bài đăng của tôi</span>
                  </button>

                  <button
                    className={styles.menuItem}
                    onClick={handlerFavorites}
                  >
                    <Icon icon="mdi:heart" width={24} height={24} />
                    <span>Yêu thích</span>
                  </button>

                  <button className={styles.menuItem} onClick={handleMyOrders}>
                    <Icon icon="mdi:shopping" width={24} height={24} />
                    <span>Đơn mua</span>
                  </button>

                  <button className={styles.menuItem} onClick={handleOrders}>
                    <Icon icon="mdi:package-variant" width={24} height={24} />
                    <span>Đơn bán</span>
                  </button>

                  {user.role === "admin" && (
                    <button
                      className={styles.menuItem}
                      onClick={() => {
                        router.push("/admin");
                        setShowMenuDrawer(false);
                      }}
                    >
                      <Icon icon="mdi:shield-crown" width={24} height={24} />
                      <span>Quản trị</span>
                    </button>
                  )}

                  <div className={styles.divider} />

                  <button
                    className={`${styles.menuItem} ${styles.logout}`}
                    onClick={handleLogout}
                  >
                    <Icon icon="mdi:logout" width={24} height={24} />
                    <span>Đăng xuất</span>
                  </button>
                </>
              )}

              {!user && (
                <>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      router.push("/auth/login");
                      setShowMenuDrawer(false);
                    }}
                  >
                    <Icon icon="mdi:login" width={24} height={24} />
                    <span>Đăng nhập</span>
                  </button>

                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      handleRegister();
                      setShowMenuDrawer(false);
                    }}
                  >
                    <Icon icon="mdi:account-plus" width={24} height={24} />
                    <span>Đăng ký</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderMobile;
