"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

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
    <body>
      {!hideHeaderFooter && <Header />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </body>
  );
}
