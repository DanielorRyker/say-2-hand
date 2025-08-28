"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

<<<<<<< HEAD
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
=======
export default function ClientLayout({ children }: { children: React.ReactNode }) {
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
<<<<<<< HEAD
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
    <body>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </body>
=======
    
    return <main>{children}</main>;
  }

  const noHeaderFooterRoutes = ["/auth/login", "/auth/register","/auth/verification","/auth/forgotPassword/confirmEmail","/auth/forgotPassword/changePassword"];
  const hideHeaderFooter = noHeaderFooterRoutes.includes(pathname);

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </>
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
  );
}
