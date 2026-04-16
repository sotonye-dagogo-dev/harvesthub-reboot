"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, MessageCircle } from "lucide-react";
import {
  resolveWhatsAppIntentPayload,
  sanitizeWhatsAppSource,
  sanitizeVendorName,
} from "@/lib/utils/whatsappIntent";

const MIN_WHATSAPP_DIGITS = 10;
const MAX_WHATSAPP_DIGITS = 15;

function sanitizeReturnPath(value: string | null): string {
  if (!value) {
    return "/vendors";
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/vendors";
  }
  try {
    const parsed = new URL(trimmed, "https://myharvesthub.local");
    if (parsed.origin !== "https://myharvesthub.local") {
      return "/vendors";
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/vendors";
  }
}

function normalizePhone(value: string | null): string {
  return (value || "").replace(/[^0-9]/g, "");
}

export default function WhatsAppContactGuardPage() {
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const vendorName = sanitizeVendorName(searchParams.get("vendorName"));
  const returnTo = sanitizeReturnPath(searchParams.get("returnTo"));
  const phone = normalizePhone(searchParams.get("phone"));
  const source = sanitizeWhatsAppSource(searchParams.get("source"));
  const intent = resolveWhatsAppIntentPayload({
    source,
    vendorName,
    productName: searchParams.get("productName"),
    message: searchParams.get("message"),
    contextUrl: searchParams.get("contextUrl"),
  });
  const isValidPhone = phone.length >= MIN_WHATSAPP_DIGITS && phone.length <= MAX_WHATSAPP_DIGITS;
  const externalHref = isValidPhone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(intent.message)}`
    : null;

  const handleContinue = async () => {
    if (!externalHref || isRedirecting) return;
    setIsRedirecting(true);

    const maskedPhone =
      phone.length > 4 ? `${"*".repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}` : phone;

    try {
      void fetch("/api/telemetry/off-platform-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "WHATSAPP",
          vendorName,
          maskedPhone,
          source,
        }),
        keepalive: true,
      });
    } catch {
      // Telemetry is best-effort and should not block contact handoff.
    }

    window.location.assign(externalHref);
  };

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
              You’re about to leave MyHarvestHub and contact {intent.vendorName} on an external platform.
            </p>
          </div>
        </div>
        {intent.contextUrl ? (
          <p className="mb-4 text-xs text-ds-text-secondary">
            Chat context includes listing link: <span className="font-medium">{intent.contextUrl}</span>
          </p>
        ) : null}

        <ul className="mb-5 list-disc space-y-2 pl-5 text-sm text-ds-text-secondary">
          <li>Never share your password, OTP, or card PIN in chat.</li>
          <li>
            Confirm order details and totals in MyHarvestHub, and complete payment only inside the
            platform checkout flow.
          </li>
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
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={isRedirecting}
              className="inline-flex items-center gap-2 rounded-ds-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              {isRedirecting ? "Redirecting..." : "Continue to WhatsApp"}
            </button>
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
