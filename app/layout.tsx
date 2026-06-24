import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "EEE – Exit Exam Ethiopia",
  description: "Prepare, Practice, Pass. Ethiopia's #1 Exit Exam preparation platform.",
  keywords: "exit exam, Ethiopia, university, MCQ, preparation, practice",
  manifest: "/manifest.json",
  // iOS PWA
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EEE",
    startupImage: [
      { url: "/icons/icon-512.svg" },
    ],
  },
  // Icons
  icons: {
    icon: [
      { url: "/icons/icon.svg",     type: "image/svg+xml" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    shortcut: "/icons/icon.svg",
  },
  // Open Graph
  openGraph: {
    title: "EEE – Exit Exam Ethiopia",
    description: "Prepare, Practice, Pass.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)",  color: "#14532d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* iOS web app meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EEE" />
        {/* Windows tile */}
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.svg" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
