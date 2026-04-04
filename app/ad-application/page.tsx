"use client";

import { FormEvent, useState } from "react";

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
  durationType: "HOURLY" | "DAILY";
  durationValue: string;
  amountPaid: string;
  proofOfTransferUrl: string;
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
  durationType: "DAILY",
  durationValue: "1",
  amountPaid: "",
  proofOfTransferUrl: "",
};

export default function AdApplicationPage() {
  const [form, setForm] = useState<ApplyFormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = (key: keyof ApplyFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ads/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationValue: Number(form.durationValue),
          amountPaid: Number(form.amountPaid),
          position: "TOP",
          theme: "BUSINESS",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit ad application");
      }

      setSuccess("Application submitted successfully. Our team will review it shortly.");
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
        and payment proof for admin review.
      </p>

      <div className="mt-4 rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-4 text-sm text-ds-text-secondary">
        Include a valid banner image URL and proof-of-transfer URL. Applications are reviewed in the
        order they are received.
      </div>

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
          aria-label="Banner Image URL"
          type="url"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.imageUrl}
          onChange={(e) => updateField("imageUrl", e.target.value)}
          placeholder="Banner Image URL"
        />
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
        <input
          aria-label="Proof of Transfer URL"
          type="url"
          required
          className="w-full rounded-ds-md border border-ds-border-base px-3 py-2"
          value={form.proofOfTransferUrl}
          onChange={(e) => updateField("proofOfTransferUrl", e.target.value)}
          placeholder="Proof of Transfer URL"
        />

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
