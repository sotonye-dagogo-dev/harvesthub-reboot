"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);

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
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage((err instanceof Error && err.message) || "Network error");
      }
    })();
  }, [token]);

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
      <h1 className="text-2xl font-bold mb-4">Verify your email</h1>
      {status === "loading" && <p className="text-ds-text-secondary">Verifying...</p>}
      {status === "success" && <p className="mb-4 text-green-500">{message}</p>}
      {status === "error" && <p className="mb-4 text-red-500">{message}</p>}
      {!token && (
        <p className="text-ds-text-secondary mb-4">
          No verification token found in the URL. If you didn&apos;t receive an email, enter your
          address below to resend the verification link.
        </p>
      )}

      <form onSubmit={handleResend} className="space-y-3">
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
