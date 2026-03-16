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
    <main style={{ maxWidth: 760, margin: "48px auto", padding: "0 16px" }}>
      <h1>Verify your email</h1>
      {status === "loading" && <p>Verifying...</p>}
      {status === "success" && <p style={{ color: "green" }}>{message}</p>}
      {status === "error" && <p style={{ color: "red" }}>{message}</p>}
      {!token && (
        <p>
          No verification token found in the URL. If you didn&apos;t receive an email, enter your address
          below to resend the verification link.
        </p>
      )}

      <form onSubmit={handleResend} style={{ marginTop: 24 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ padding: 8, width: "100%", maxWidth: 420 }}
        />
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={resendLoading} style={{ padding: "8px 16px" }}>
            {resendLoading ? "Sending…" : "Resend verification email"}
          </button>
        </div>
      </form>
    </main>
  );
}
