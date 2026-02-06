import { Metadata } from "next";
import { Footer } from "@/components/layout";

export const metadata: Metadata = {
  title: "Login | HarvestHub",
  description: "Sign in to your HarvestHub account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4 py-12 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <Footer />
    </div>
  );
}
