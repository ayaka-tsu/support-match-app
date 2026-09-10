import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/context/StoreContext";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import { MatchingProvider } from "@/context/MatchingContext";
import ProfileGate from "@/components/ProfileGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "見てて",
  description: "ちょっと見てて、を気軽につなぐアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Link href="/" className="inline-flex items-center px-4 py-3">
          <Image
            src="/mitete-logo.png"
            alt="mitete ロゴ"
            width={180}
            height={70}
            priority
          />
        </Link>

        <StoreProvider>
          <MatchingProvider>
            <ProfileGate>{children}</ProfileGate>
          </MatchingProvider>
        </StoreProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
