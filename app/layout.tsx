import "@/app/_styles/globals.css";
import { ReactNode } from "react";
import { Header, Footer } from "@/components/layout";
import { TopAdBanner } from "@/components/features";
import { Providers } from "@/app/providers";

export const metadata = {
  title: "MyHarvestHub — The field the Lord has blessed",
  description:
    "MyHarvestHub is the trusted marketplace of verified sellers, open to every buyer. The field the Lord has blessed.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport = {
  themeColor: "#2B0B4E",
};

export const dynamic = "force-dynamic";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-ds-surface-base text-ds-text-primary">
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* Phones: header first, promo strip under it. Larger screens: strip above the header. */}
            <TopAdBanner className="order-2 md:order-1" />
            <Header className="order-1 md:order-2" />
            <main className="order-3 flex-1 bg-ds-surface-sunken dark:bg-ds-surface-sunken">
              {children}
            </main>
            <Footer className="order-4" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
