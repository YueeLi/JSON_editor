import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = new URL("https://json-editor-inky.vercel.app");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "JSON Editor — 格式化 / 校验 / 压缩",
    template: "%s | JSON Editor",
  },
  description: "在线 JSON 工具：格式校验（提示行列）、结构化展示、格式化与一键压缩复制。",
  keywords: [
    "JSON",
    "JSON 格式化",
    "JSON 校验",
    "JSON 压缩",
    "JSON minify",
    "JSON pretty",
    "在线工具",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "JSON Editor — 格式化 / 校验 / 压缩",
    description: "在线 JSON 工具：格式校验（提示行列）、结构化展示、格式化与一键压缩复制。",
    siteName: "JSON Editor",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "JSON Editor — 格式化 / 校验 / 压缩",
    description: "在线 JSON 工具：格式校验（提示行列）、结构化展示、格式化与一键压缩复制。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Prevent a flash of incorrect theme by setting the `dark` class before paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (stored === 'system' && prefersDark) || (!stored && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  } catch {}
})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
