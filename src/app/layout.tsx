import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { QueryProvider } from "../providers/query-provider";
import { MobileLayout } from "@/shared/components/layout/mobile-layout";
import { BottomNavigation } from "@/shared/components/layout/bottom-navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PinPaw",
  description: "반려동물을 찾는 서비스",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const naverMapClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {naverMapClientId && (
          <Script
            strategy="beforeInteractive"
            src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverMapClientId}`}
          />
        )}
        <QueryProvider>
          <MobileLayout>
            {children}
            <BottomNavigation />
          </MobileLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
