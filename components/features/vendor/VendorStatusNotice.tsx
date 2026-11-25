"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, XCircle } from "lucide-react";

type VendorStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

/**
 * Status banner at the top of the vendor dashboard. Explains what the vendor can and can't do
 * while their store is under review, suspended or rejected. Renders nothing for approved vendors.
 */
export function VendorStatusNotice() {
  const [status, setStatus] = useState<VendorStatus | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || data?.user?.role !== "VENDOR") return;
        const next = data?.roleData?.status;
        if (next === "PENDING" || next === "SUSPENDED" || next === "REJECTED" || next === "APPROVED") {
          setStatus(next);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!status || status === "APPROVED") return null;

  if (status === "PENDING") {
    return (
      <div
        role="status"
        className="mb-4 flex items-start gap-3 rounded-ds-md border border-ds-status-info/30 bg-ds-status-info-bg p-4 text-sm text-ds-status-info-text"
      >
        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Your store is under review</p>
          <p className="mt-0.5">
            You can add listings now. They show an &quot;Unverified&quot; badge until the MyHarvestHub team approves
            your documents.
          </p>
        </div>
      </div>
    );
  }

  const suspended = status === "SUSPENDED";
  const Icon = suspended ? AlertTriangle : XCircle;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-ds-md border border-ds-status-error/30 bg-ds-status-error-bg p-4 text-sm text-ds-status-error-text"
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{suspended ? "Your store is suspended" : "Your vendor application was not approved"}</p>
        <p className="mt-0.5">
          Your store and listings are hidden from buyers, and you can&apos;t add or edit listings. You can still
          complete orders that were already placed.{" "}
          <Link href="/help" className="font-semibold underline">
            Contact support
          </Link>{" "}
          {suspended ? "to restore your store." : "if you think this is a mistake."}
        </p>
      </div>
    </div>
  );
}

export default VendorStatusNotice;
