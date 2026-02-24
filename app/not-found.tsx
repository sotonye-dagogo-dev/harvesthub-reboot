import Link from "next/link";
import { Home, ShoppingBag, Search, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-surface-sunken px-4 dark:bg-ds-surface-sunken">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-ds-text-brand">404</h1>
          <div className="mt-4 text-2xl font-semibold text-ds-text-primary">
            Page Not Found
          </div>
          <p className="mt-2 text-ds-text-secondary">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 rounded-lg border border-ds-border-base p-6 transition-all hover:border-ds-brand-muted hover:shadow-ds-md"
          >
            <Home className="h-8 w-8 text-ds-text-brand" />
            <span className="font-medium text-ds-text-primary">Home</span>
          </Link>

          <Link
            href="/products"
            className="flex flex-col items-center gap-2 rounded-lg border border-ds-border-base p-6 transition-all hover:border-ds-brand-muted hover:shadow-ds-md"
          >
            <ShoppingBag className="h-8 w-8 text-ds-text-brand" />
            <span className="font-medium text-ds-text-primary">Products</span>
          </Link>

          <Link
            href="/vendors"
            className="flex flex-col items-center gap-2 rounded-lg border border-ds-border-base p-6 transition-all hover:border-ds-brand-muted hover:shadow-ds-md"
          >
            <Search className="h-8 w-8 text-ds-text-brand" />
            <span className="font-medium text-ds-text-primary">Vendors</span>
          </Link>

          <Link
            href="/help"
            className="flex flex-col items-center gap-2 rounded-lg border border-ds-border-base p-6 transition-all hover:border-ds-brand-muted hover:shadow-ds-md"
          >
            <HelpCircle className="h-8 w-8 text-ds-text-brand" />
            <span className="font-medium text-ds-text-primary">Help</span>
          </Link>
        </div>

        {/* Primary Action */}
        <Link
          href="/"
          className="inline-block rounded-lg bg-ds-brand-primary px-8 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
        >
          Go Back Home
        </Link>

        {/* Additional Help */}
        <p className="mt-8 text-sm text-ds-text-secondary">
          Need help?{" "}
          <Link href="/contact" className="text-ds-text-brand hover:underline">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}
