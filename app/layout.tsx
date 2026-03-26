import "@/app/_styles/globals.css";
import { ReactNode } from "react";
import { Header, Footer } from "@/components/layout";
import { TopAdBanner } from "@/components/features";
import { Providers } from "@/app/providers";

export const metadata = {
  title: "MyHarvestHub",
  description: "Next-gen agriculture e-commerce for campus vendors and buyers",
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
            <TopAdBanner />
            <Header />
            <main className="flex-1 bg-ds-surface-sunken dark:bg-ds-surface-sunken">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
