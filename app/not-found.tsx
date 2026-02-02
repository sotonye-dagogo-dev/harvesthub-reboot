import Link from "next/link";
import { Home, ShoppingBag, Search, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600 dark:text-purple-400">404</h1>
          <div className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Page Not Found
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-6 transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:hover:border-purple-700"
          >
            <Home className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">Home</span>
          </Link>

          <Link
            href="/products"
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-6 transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:hover:border-purple-700"
          >
            <ShoppingBag className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">Products</span>
          </Link>

          <Link
            href="/vendors"
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-6 transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:hover:border-purple-700"
          >
            <Search className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">Vendors</span>
          </Link>

          <Link
            href="/help"
            className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-6 transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:hover:border-purple-700"
          >
            <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-gray-900 dark:text-white">Help</span>
          </Link>
        </div>

        {/* Primary Action */}
        <Link
          href="/"
          className="inline-block rounded-lg bg-purple-600 px-8 py-3 font-semibold text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
        >
          Go Back Home
        </Link>

        {/* Additional Help */}
        <p className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          Need help?{" "}
          <Link href="/contact" className="text-purple-600 hover:underline dark:text-purple-400">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}
