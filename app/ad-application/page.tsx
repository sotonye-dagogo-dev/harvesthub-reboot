"use client";

import { FormEvent, useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";
import { BannerPlacementPreview, BannerImageGuidelines } from "@/components/features";
import { message } from "antd";
import type { BannerPlacementWarning } from "@/lib/utils/bannerPlacementValidation";
import { generateRequestKey } from "@/lib/utils/requestKey";
import {
  buildPaystackReference,
  initializePaystackInlinePayment,
} from "@/lib/utils/paystackInline";

type ApplyFormState = {
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  paymentMethod: "BANK_TRANSFER" | "CARD" | "USSD";
  paymentGateway?: "PAYSTACK" | "FLUTTERWAVE";
  paymentReference?: string;
  durationType: "HOURLY" | "DAILY";
  durationValue: string;
  amountPaid: string;
  proofOfTransferUrl: string;
  imagePublicId?: string;
  proofPublicId?: string;
  requestKey?: string;
};

const initialState: ApplyFormState = {
  name: "",
  email: "",
  phoneNumber: "",
  companyName: "",
  title: "",
  description: "",
  imageUrl: "",
  linkUrl: "",
  paymentMethod: "BANK_TRANSFER",
  paymentGateway: "PAYSTACK",
  paymentReference: "",
  durationType: "DAILY",
  durationValue: "1",
  amountPaid: "",
  proofOfTransferUrl: "",
  imagePublicId: "",
  proofPublicId: "",
};

export default function AdApplicationPage() {
  const [form, setForm] = useState<ApplyFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [placementWarning, setPlacementWarning] = useState<BannerPlacementWarning | null>(null);

  const updateField = (key: keyof ApplyFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const paymentToastKey = "public-ad-payment-status";
      let paymentReference = form.paymentReference;
      let paymentVerificationReference: string | undefined;
      const isBankTransfer = form.paymentMethod === "BANK_TRANSFER";

      if (!isBankTransfer) {
        message.open({
          key: paymentToastKey,
          type: "loading",
          content: "Redirecting to secure payment...",
          duration: 0,
        });
        const configRes = await fetch("/api/payments/config", { cache: "no-store" });
        const configData = await configRes.json().catch(() => ({}));
        const paystackPublicKey =
          typeof configData?.paystackPublicKey === "string" &&
          configData.paystackPublicKey.trim().length > 0
            ? configData.paystackPublicKey.trim()
            : null;
        if (!paystackPublicKey) {
          throw new Error("Paystack public key is unavailable for inline payment.");
        }

        const resolvedReference: string = await new Promise((resolve, reject) => {
          initializePaystackInlinePayment({
            key: paystackPublicKey,
            email: form.email,
            amount: Number(form.amountPaid),
            currency: "NGN",
            reference: buildPaystackReference("PUBADV"),
            metadata: {
              source: "public-ad-application",
              paymentMethod: form.paymentMethod,
            },
            onSuccess: (result) => resolve(result.reference),
            onClose: () => reject(new Error("Payment popup closed before completion.")),
          }).catch(reject);
        });

        message.open({
          key: paymentToastKey,
          type: "loading",
          content: "Verifying payment...",
          duration: 0,
        });

        paymentReference = resolvedReference;
        paymentVerificationReference = resolvedReference;
      } else if (!form.proofOfTransferUrl) {
        throw new Error("Please upload proof of transfer for bank transfer.");
      }

      const requestKey = generateRequestKey("public-ad-application-submit");
      const response = await fetch("/api/ads/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": requestKey,
        },
        body: JSON.stringify({
          ...form,
          paymentGateway: form.paymentMethod === "BANK_TRANSFER" ? undefined : "PAYSTACK",
          paymentReference: form.paymentMethod === "BANK_TRANSFER" ? undefined : paymentReference,
          paymentVerificationReference:
            form.paymentMethod === "BANK_TRANSFER" || !paymentReference
              ? undefined
              : paymentVerificationReference,
          proofOfTransferUrl:
            form.paymentMethod === "BANK_TRANSFER" ? form.proofOfTransferUrl : undefined,
          durationValue: Number(form.durationValue),
          amountPaid: Number(form.amountPaid),
          position: "TOP",
          theme: "BUSINESS",
          requestKey,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit ad application");
      }

      if (data?.paymentConfirmationPending) {
        setSuccess(
          data?.message ||
            "Application submitted and payment confirmation is pending. It will update automatically once reconciliation completes."
        );
        message.open({
          key: paymentToastKey,
          type: "warning",
          content:
            data?.message ||
            "Payment was received and is awaiting confirmation. Your application will update automatically.",
          duration: 5,
        });
      } else {
        setSuccess("Application submitted successfully. Our team will review it shortly.");
        if (!isBankTransfer) {
          message.open({
            key: paymentToastKey,
            type: "success",
            content: "Payment completed successfully.",
            duration: 4,
          });
        }
      }
      setForm(initialState);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Submission failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-ds-text-primary">Public Ad Application</h1>
      <p className="mt-2 text-ds-text-secondary">
        Promote your business, event, or announcement on MyHarvestHub. Submit your campaign details
        for admin review.
      </p>

      <div className="mt-4 rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-4 text-sm text-ds-text-secondary">
        Upload your banner image using the managed uploader below. Applications are reviewed in the
        order they are received.
      </div>

      <BannerImageGuidelines
        className="mt-4"
        title="Sponsored Image Guidelines"
        subtitle="Review hero, top, and sidebar sizes so your design can be approved for available sponsored slots."
      />

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-ds-md border border-ds-status-error-border bg-ds-status-error-surface p-3 text-sm text-ds-status-error-text"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-ds-md border border-ds-status-success-border bg-ds-status-success-surface p-3 text-sm text-ds-status-success-text">
          {success}
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          aria-label="Full Name"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Full Name"
        />
        <input
          aria-label="Email"
          type="email"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="Email"
        />
        <input
          aria-label="Phone Number"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.phoneNumber}
          onChange={(e) => updateField("phoneNumber", e.target.value)}
          placeholder="Phone Number"
        />
        <input
          aria-label="Company Name"
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.companyName}
          onChange={(e) => updateField("companyName", e.target.value)}
          placeholder="Company Name (optional)"
        />
        <input
          aria-label="Campaign Title"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Campaign Title"
        />
        <textarea
          aria-label="Description"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Description"
          rows={4}
        />
        <input
          aria-label="Banner Image Upload Reference"
          type="hidden"
          required
          value={form.imageUrl}
          onChange={(e) => updateField("imageUrl", e.target.value)}
        />
        <div className="rounded-ds-md border border-ds-border-base p-3">
          <p className="mb-2 text-sm font-medium text-ds-text-primary">Banner Image *</p>
          <ImageUpload
            folderType="ad"
            skipPersistence
            placementValidation={{ placement: "TOP", onWarning: setPlacementWarning }}
            onUploaded={(result) => {
              updateField("imageUrl", result.url);
              updateField("imagePublicId", result.publicId);
            }}
          />
        </div>
        {placementWarning ? (
          <div className="rounded-ds-md border border-ds-status-warning-border bg-ds-status-warning-bg px-3 py-2 text-xs text-ds-status-warning-text">
            {placementWarning.message}
          </div>
        ) : null}
        <BannerPlacementPreview position="TOP" imageUrl={form.imageUrl} title={form.title} />
        <input
          aria-label="Destination Link URL"
          type="url"
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.linkUrl}
          onChange={(e) => updateField("linkUrl", e.target.value)}
          placeholder="Destination Link URL (optional)"
        />

        <select
          aria-label="Payment Method"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.paymentMethod}
          onChange={(e) => updateField("paymentMethod", e.target.value)}
        >
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CARD">Card</option>
          <option value="USSD">USSD</option>
        </select>

        <div className="grid gap-4 sm:grid-cols-2">
          <select
            aria-label="Duration Type"
            required
            className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
            value={form.durationType}
            onChange={(e) => updateField("durationType", e.target.value)}
          >
            <option value="DAILY">Daily</option>
            <option value="HOURLY">Hourly</option>
          </select>

          <input
            aria-label="Duration Value"
            type="number"
            min={1}
            required
            className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
            value={form.durationValue}
            onChange={(e) => updateField("durationValue", e.target.value)}
            placeholder="Duration Value"
          />
        </div>

        <input
          aria-label="Amount Paid"
          type="number"
          min={1}
          step="0.01"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.amountPaid}
          onChange={(e) => updateField("amountPaid", e.target.value)}
          placeholder="Amount Paid"
        />
        {form.paymentMethod === "BANK_TRANSFER" && (
          <>
            <input
              aria-label="Proof of Transfer Upload Reference"
              type="hidden"
              required
              value={form.proofOfTransferUrl}
              onChange={(e) => updateField("proofOfTransferUrl", e.target.value)}
            />
            <div className="rounded-ds-md border border-ds-border-base p-3">
              <p className="mb-2 text-sm font-medium text-ds-text-primary">Proof of Transfer *</p>
              <ImageUpload
                folderType="payment-proof"
                skipPersistence
                onUploaded={(result) => {
                  updateField("proofOfTransferUrl", result.url);
                  updateField("proofPublicId", result.publicId);
                }}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-ds-md bg-ds-brand-primary px-4 py-2 text-white hover:bg-ds-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
