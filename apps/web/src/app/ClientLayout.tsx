"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/app/layouts/Header";
import HeaderMobile from "@/app/layouts/HeaderMobile";
import Footer from "@/app/layouts/Footer";
import { ToastProvider } from "@/components/ui/toast/ToastContext";
import styles from "./clientLayout.module.scss";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // reset class cũ
    document.body.classList.remove("home", "about");

    if (pathname === "/") {
      document.body.classList.add("home");
    } else {
      document.body.classList.add("about");
    }
  }, [pathname]);

  if (!mounted) {
    // Even when not mounted we must provide the ToastProvider so client
    // components that call useToast during hydration don't throw.
    return (
      <ToastProvider>
        <main>{children}</main>
      </ToastProvider>
    );
  }

  const noHeaderFooterRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/verification",
    "/auth/forgotPassword/confirmEmail",
    "/auth/forgotPassword/changePassword",
  ];
  const hideHeaderFooter = noHeaderFooterRoutes.includes(pathname);

  const noFooterRoutes = ["/admin"];
  const hideFooter = noFooterRoutes.some((route) => pathname.startsWith(route));
  return (
    <ToastProvider>
      {!hideHeaderFooter && (
        <>
          {/* Desktop Header - Hiển thị từ 640px trở lên */}
          <div className="hidden sm:block">
            <Header />
          </div>
          {/* Mobile Header - Chỉ hiển thị dưới 640px */}
          <div className="block sm:hidden">
            <HeaderMobile />
          </div>
        </>
      )}
      {/* Main content với padding-top cho mobile header */}
      <main
        className={
          !hideHeaderFooter ? styles.mainContent : styles.mainContentNoHeader
        }
      >
        {children}
      </main>
      {!hideHeaderFooter && !hideFooter && <Footer />}
    </ToastProvider>
  );
}
