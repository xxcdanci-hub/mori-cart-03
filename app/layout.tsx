import type { Metadata } from "next";
import { headers } from "next/headers";
import { Bricolage_Grotesque, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Noto_Sans_SC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return {
    title: "MORI Cart 03 — 移动边柜拆解展示",
    description:
      "一台融合胡桃木、藤编与黄铜结构的移动边柜，以滚动交互展示每一个组成部件。",
    openGraph: {
      title: "MORI Cart 03",
      description: "一台边柜，走到生活发生的地方。",
      images: [{ url: `${origin}/og.png`, width: 1733, height: 909, alt: "MORI Cart 03 移动边柜" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "MORI Cart 03",
      description: "一台边柜，走到生活发生的地方。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preload" as="image" href="hero-living-room-v1.jpg" fetchPriority="high" />
      </head>
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
