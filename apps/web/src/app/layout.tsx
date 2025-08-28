import type { Metadata } from "next";
<<<<<<< HEAD
import "@/styles/globals.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ClientLayout from "@/components/ClientLayout";

=======
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
export const metadata: Metadata = {
  title: "Say 2 Hand",
  description: "Nền tảng trao đổi/thanh lý đồ cũ cộng đồng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <body>
=======
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
        <AntdRegistry>
          <ClientLayout>{children}</ClientLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
