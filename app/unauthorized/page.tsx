import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-surface-sunken">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-ds-text-brand">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-ds-text-primary dark:text-ds-text-primary">
          Unauthorized Access
        </h2>
        <p className="mt-2 text-ds-text-secondary">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-ds-brand-primary px-6 py-3 text-white hover:bg-ds-brand-primary-hover"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
