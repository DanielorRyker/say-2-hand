"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/app/layouts/Header";
import Footer from "@/app/layouts/Footer";

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
    return <main>{children}</main>;
  }

  const noHeaderFooterRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/verification",
    "/auth/forgotPassword/confirmEmail",
    "/auth/forgotPassword/changePassword",
  ];
  const hideHeaderFooter = noHeaderFooterRoutes.includes(pathname);

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}
