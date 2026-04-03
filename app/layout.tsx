import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ 
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Đếm Thú Cưng - Game Học Sinh",
  description: "Game đếm thú cưng - Người chơi đua với AI để đếm số chó và mèo trong ảnh",
};

export const viewport: Viewport = {
  themeColor: "#4682b4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
