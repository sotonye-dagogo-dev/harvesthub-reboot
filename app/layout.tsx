import React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Providers } from "./providers";
import OfflineNotice from "@/components/features/pwa/OfflineNotice";
import "@/app/_styles/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | MyHarvestHub",
    default: "MyHarvestHub | Faith-Based E-Marketplace",
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
    "MyHarvestHub",
  ],
  authors: [{ name: "MyHarvestHub Team" }],
  creator: "MyHarvestHub",
  publisher: "MyHarvestHub",
  metadataBase: new URL("https://myharvesthub.org"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://myharvesthub.org",
    title: "MyHarvestHub | Faith-Based E-Marketplace",
    description: "A faith-based e-marketplace connecting Christian communities with trusted vendors.",
    siteName: "MyHarvestHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyHarvestHub | Faith-Based E-Marketplace",
    description: "A faith-based e-marketplace connecting Christian communities with trusted vendors.",
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
