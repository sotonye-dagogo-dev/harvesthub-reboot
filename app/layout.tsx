import React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Providers } from "./providers";
import { TopAdBanner } from "@/components/features";
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
      <body className={GeistSans.className}>
        <Providers>
          {/* Fixed top ad strip — pushes page content down by its height (10) */}
          <TopAdBanner />
          <main className="pt-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
};

export default layout;
