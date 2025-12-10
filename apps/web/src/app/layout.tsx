import type { Metadata } from "next";
import "@/styles/globals.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import ClientLayout from "@/app/ClientLayout";

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
    <html lang="en" className="mdl-js">
      <body suppressHydrationWarning={true}>
        {/* Server-rendered placeholder for client-only toast portal */}
        <div id="__toast_root" />
        <AntdRegistry>
          <ClientLayout>{children}</ClientLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
