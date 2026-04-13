"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, MessageCircle } from "lucide-react";

function sanitizeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/vendors";
  }
  return value;
}

function sanitizeVendorName(value: string | null): string {
  if (!value) return "this vendor";
  const clean = value.trim();
  return clean.length > 0 ? clean.slice(0, 80) : "this vendor";
}

function normalizePhone(value: string | null): string {
  return (value || "").replace(/[^0-9]/g, "");
}

export default function WhatsAppContactGuardPage() {
  const searchParams = useSearchParams();

  const vendorName = sanitizeVendorName(searchParams.get("vendorName"));
  const returnTo = sanitizeReturnPath(searchParams.get("returnTo"));
  const phone = normalizePhone(searchParams.get("phone"));
  const isValidPhone = phone.length >= 10 && phone.length <= 15;
  const externalHref = isValidPhone ? `https://wa.me/${phone}` : null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-6 shadow-ds-sm">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-ds-status-warning-text" />
          <div>
            <h1 className="text-xl font-semibold text-ds-text-primary">
              Before you continue to WhatsApp
            </h1>
            <p className="mt-1 text-sm text-ds-text-secondary">
              You’re about to leave MyHarvestHub and contact {vendorName} on an external platform.
            </p>
          </div>
        </div>

        <ul className="mb-5 list-disc space-y-2 pl-5 text-sm text-ds-text-secondary">
          <li>Never share your password, OTP, or card PIN in chat.</li>
          <li>Confirm order details and totals inside MyHarvestHub before payment.</li>
          <li>Report suspicious behavior through the in-app bug/support channels.</li>
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={returnTo}
            className="inline-flex items-center gap-2 rounded-ds-md border border-ds-border-base px-4 py-2 text-sm text-ds-text-primary transition-colors hover:bg-ds-surface-sunken"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {externalHref ? (
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-ds-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              Continue to WhatsApp
            </a>
          ) : (
            <p className="text-sm text-ds-status-error-text">
              This vendor’s WhatsApp number is currently unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
