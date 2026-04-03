import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

const outfitFont = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bid Elite — Elite Nexus RFQ Platform",
  description:
    "Professional RFQ & Bidding Management Platform by Elite Nexus. Create RFQs, collect supplier quotes, and compare bids in one place.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Bid Elite — Elite Nexus RFQ Platform",
    description:
      "Professional RFQ & Bidding Management Platform by Elite Nexus",
    siteName: "Bid Elite",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfitFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
