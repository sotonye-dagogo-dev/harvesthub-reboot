"use client";

import { useEffect } from "react";
import { Button, Result } from "antd";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function VendorError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Vendor section error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Result
        status="500"
        title={<span className="text-ds-text-primary">Vendor Dashboard Error</span>}
        subTitle={
          <span className="text-ds-text-tertiary">
            {error.message || "An error occurred. Please try again."}
          </span>
        }
        extra={[
          <Button
            key="retry"
            type="primary"
            onClick={reset}
            className="bg-ds-brand-primary hover:bg-ds-brand-primary-hover border-ds-border-brand"
          >
            Try Again
          </Button>,
          <Link key="dashboard" href="/operations/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>,
        ]}
      />
      {process.env.NODE_ENV === "development" && (
        <details className="mt-6 max-w-md">
          <summary className="text-xs text-ds-text-placeholder cursor-pointer">Dev Details</summary>
          <pre className="mt-2 text-xs text-ds-status-error whitespace-pre-wrap break-all bg-ds-surface-raised p-4 rounded-ds-xs">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
