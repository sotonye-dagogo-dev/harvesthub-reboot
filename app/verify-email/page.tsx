"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { getPendingAuthRedirect, sanitizeInternalRedirectPath } from "@/lib/utils/authRedirect";

function withLoginContinuation(redirectPath: string, continuation: string): string {
  if (!continuation) return redirectPath;
  const safePath = sanitizeInternalRedirectPath(redirectPath, "/login?verified=1");
  const parsed = new URL(safePath, "https://myharvesthub.local");
  if (!parsed.pathname.startsWith("/login")) {
    return safePath;
  }
  if (!parsed.searchParams.get("from")) {
    parsed.searchParams.set("from", continuation);
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const emailFromQuery = search.get("email") || "";
  const continuationFromQuery = sanitizeInternalRedirectPath(search.get("from"), "");
  const isEmailChangeToken = token.startsWith("email-change:");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>(emailFromQuery.toLowerCase());
  const [resendLoading, setResendLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const [redirectPath, setRedirectPath] = useState("/login?verified=1");

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery.toLowerCase());
    }
  }, [emailFromQuery]);

  useEffect(() => {
    if (!token) return;
    setStatus("loading");
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully.");
          const baseRedirect =
            typeof data.redirectTo === "string" && data.redirectTo.length > 0
              ? data.redirectTo
              : "/login?verified=1";
          const continuation = continuationFromQuery || getPendingAuthRedirect() || "";
          setRedirectPath(withLoginContinuation(baseRedirect, continuation));
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage((err instanceof Error && err.message) || "Network error");
      }
    })();
  }, [continuationFromQuery, router, token]);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    const timer = window.setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          router.push(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [redirectPath, router, status]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email to resend verification.");
      return;
    }
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.message || "Verification link sent if account exists.");
      } else {
        setMessage(data.error || "Failed to resend verification.");
      }
    } catch (err) {
      setMessage((err instanceof Error && err.message) || "Network error");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-12 max-w-lg px-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEmailChangeToken ? "Confirm your new email" : "Verify your email"}
      </h1>
      <p className="mb-3 text-sm text-ds-text-secondary">
        {isEmailChangeToken
          ? "Click the verification link sent to your new email address to complete the change."
          : "Check your inbox and click the verification link we sent to complete your signup."}
      </p>
      {email ? (
        <p className="mb-4 text-sm text-ds-text-secondary">
          Verification email recipient: <span className="font-semibold text-ds-text-primary">{email}</span>
        </p>
      ) : null}
      {status === "loading" && <p className="text-ds-text-secondary">Verifying...</p>}
      {status === "success" && (
        <div className="mb-4 space-y-2">
          <p className="text-green-600 dark:text-green-400">{message}</p>
          <p className="text-sm text-ds-text-secondary">
            Redirecting to sign in in {redirectCountdown}s...
          </p>
          <Link
            href={redirectPath}
            className="inline-flex rounded-ds-md bg-ds-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-ds-brand-primary-hover"
          >
            Continue to Login
          </Link>
        </div>
      )}
      {status === "error" && <p className="mb-4 text-red-500">{message}</p>}
      {!token && (
        <p className="text-ds-text-secondary mb-4">
          No verification token found in the URL. If you didn&apos;t receive an email, confirm the
          recipient address below and resend the verification link.
        </p>
      )}

      <form onSubmit={handleResend} className="space-y-3">
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.toLowerCase())}
          placeholder="you@example.com"
          className="w-full max-w-md rounded-md border border-ds-border-base bg-ds-surface-base p-2 text-sm dark:bg-ds-surface-sunken dark:text-ds-text-primary"
        />
        <div>
          <button
            type="submit"
            disabled={resendLoading}
            className="min-w-[150px] rounded-ds-md bg-ds-brand-primary px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
        </div>
      </form>
    </main>
  );
}
