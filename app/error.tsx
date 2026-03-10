"use client";

import { useEffect, useState } from "react";
import { Button, Result } from "antd";
import { WifiOff } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function isNetworkError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  );
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    console.error("Global error:", error);
    setOffline(isNetworkError(error));
  }, [error]);

  if (offline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken dark:bg-ds-surface-sunken px-4">
        <Result
          icon={<WifiOff className="mx-auto h-16 w-16 text-ds-text-tertiary" />}
          title={<span className="text-ds-text-primary">You&apos;re Offline</span>}
          subTitle={
            <span className="text-ds-text-tertiary">
              This page needs an internet connection. Check your network and try again.
            </span>
          }
          extra={[
            <Button
              key="retry"
              type="primary"
              onClick={reset}
              className="bg-ds-brand-primary hover:bg-ds-brand-primary-hover border-ds-border-brand"
            >
              Retry
            </Button>,
            <Button key="home" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ds-surface-sunken dark:bg-ds-surface-sunken px-4">
      <Result
        status="500"
        title={<span className="text-ds-text-primary">Something went wrong</span>}
        subTitle={
          <span className="text-ds-text-tertiary">
            {error.message || "An unexpected error occurred. Please try again."}
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
          <Button key="home" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>,
        ]}
      />
      {process.env.NODE_ENV === "development" && error.digest && (
        <p className="mt-4 text-xs text-ds-text-placeholder font-mono">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
