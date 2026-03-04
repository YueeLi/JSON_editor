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
    default: "JSON Editor — Format, Validate, Minify",
    template: "%s | JSON Editor",
  },
  description:
    "Online JSON editor: validate with line/column errors, live tree view, format (pretty) and minify with one-click copy.",
  keywords: [
    "JSON",
    "JSON editor",
    "JSON formatter",
    "JSON validator",
    "JSON minify",
    "JSON pretty print",
    "online tool",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "JSON Editor — Format, Validate, Minify",
    description:
      "Validate JSON with line/column errors, view as a tree, format and minify with one-click copy.",
    siteName: "JSON Editor",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "JSON Editor — Format, Validate, Minify",
    description:
      "Validate JSON with line/column errors, view as a tree, format and minify with one-click copy.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
