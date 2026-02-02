import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-purple-600 dark:text-purple-400">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">
          Unauthorized Access
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
