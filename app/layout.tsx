import React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Providers } from "./providers";
import OfflineNotice from "@/components/features/pwa/OfflineNotice";
import "@/app/_styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | HarvestHub",
    default: "HarvestHub | E-Commerce Marketplace",
  },
  description:
    "A comprehensive e-commerce marketplace connecting buyers and vendors. Shop from verified vendors with integrated wallet, flexible pickup and delivery options.",
  keywords: [
    "e-commerce",
    "marketplace",
    "Lagos",
    "Nigeria",
    "church vendors",
    "online shopping",
    "HarvestHub",
  ],
  authors: [{ name: "HarvestHub Team" }],
  creator: "HarvestHub",
  publisher: "HarvestHub",
  metadataBase: new URL("https://harvesthub.ng"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://harvesthub.ng",
    title: "HarvestHub | E-Commerce Marketplace",
    description: "A comprehensive e-commerce marketplace connecting buyers and vendors in Nigeria.",
    siteName: "HarvestHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "HarvestHub | E-Commerce Marketplace",
    description: "A comprehensive e-commerce marketplace connecting buyers and vendors in Nigeria.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={GeistSans.className}>
        <Providers>
          <main>{children}</main>
          <OfflineNotice />
        </Providers>
      </body>
    </html>
  );
};

export default layout;
