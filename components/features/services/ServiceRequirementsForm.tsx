"use client";

import { useMemo, useState } from "react";
import { Input, Select } from "antd";
import { Button } from "@/components/ui";
import { useToast } from "@/lib/contexts/ToastContext";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import type { ServiceRequirementField } from "@/lib/types";
import { uploadOrderAttachment } from "./ServiceOrderRoom.upload";

export type RequirementAnswers = Record<string, string | string[]>;

export interface RequirementIssue {
  key?: string;
  field?: string;
  message?: string;
}

export function isAnswerEmpty(value: string | string[] | undefined | null): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0 || value.every((entry) => !String(entry).trim());
  return String(value).trim().length === 0;
}

/** Required = `required !== false` (matches the wizard's own defaulting rule). */
export function isRequiredField(field: ServiceRequirementField): boolean {
  return field.required !== false;
}

/** Keys of required fields with no answer yet, in field order. */
export function collectMissingAnswers(
  fields: ServiceRequirementField[],
  answers: RequirementAnswers,
): string[] {
  return fields
    .filter((field) => isRequiredField(field) && isAnswerEmpty(answers[field.key]))
    .map((field) => field.key);
}

/** True when every required field is answered — the submit gate. */
export function hasCompleteAnswers(
  fields: ServiceRequirementField[],
  answers: RequirementAnswers,
): boolean {
  return collectMissingAnswers(fields, answers).length === 0;
}

export interface ServiceRequirementsFormProps {
  orderId: string;
  fields: ServiceRequirementField[];
  answers?: RequirementAnswers | null;
  submittedAt?: string | null;
  /** Service-only orders gate fulfilment; mixed carts show answers as context. */
  gating?: boolean;
  /** Buyer may submit (order sits in `AWAITING_REQUIREMENTS`). */
  canSubmit?: boolean;
  onSubmitted?: () => void;
  uploadScope?: { userId?: string; vendorId?: string };
}

export function ServiceRequirementsForm({
  orderId,
  fields,
  answers,
  submittedAt,
  gating = true,
  canSubmit = false,
  onSubmitted,
  uploadScope,
}: ServiceRequirementsFormProps) {
  const toast = useToast();
  const [draft, setDraft] = useState<RequirementAnswers>(() => ({ ...(answers ?? {}) }));
  const [issues, setIssues] = useState<RequirementIssue[]>([]);
  const [showMissing, setShowMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const missing = useMemo(() => collectMissingAnswers(fields, draft), [fields, draft]);
  const readOnly = !canSubmit || fields.length === 0;
  const issueFor = (key: string) =>
    issues.find((issue) => (issue.key ?? issue.field) === key)?.message;

  const setValue = (key: string, value: string | string[]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setIssues((prev) => prev.filter((issue) => (issue.key ?? issue.field) !== key));
  };

  const handleUpload = async (field: ServiceRequirementField) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploadingKey(field.key);
      setUploadError(null);
      try {
        const attachment = await uploadOrderAttachment(file, uploadScope);
        setValue(field.key, attachment.url);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Unable to upload file.");
      } finally {
        setUploadingKey(null);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!hasCompleteAnswers(fields, draft)) {
      setShowMissing(true);
      return;
    }
    setShowMissing(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: draft }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        code?: string;
        issues?: RequirementIssue[];
      };
      if (!res.ok || data?.success === false) {
        if (data?.code === "REQUIREMENTS_INVALID" && Array.isArray(data.issues)) {
          setIssues(data.issues);
        }
        throw new Error(data?.error || "Unable to submit requirements.");
      }
      setIssues([]);
      toast.success("Requirements submitted. The seller can start now.");
      onSubmitted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit requirements.");
    } finally {
      setSubmitting(false);
    }
  };

  if (fields.length === 0) {
    return (
      <p className="text-sm text-ds-text-secondary">
        The seller did not request any requirements for this service.
      </p>
    );
  }

  if (readOnly) {
    const submitted = Boolean(submittedAt);
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-ds-text-primary">
            {gating ? "Your requirements" : "Requirement answers"}
          </h3>
          <span
            className={`rounded-ds-full border px-2 py-0.5 text-[11px] font-semibold ${
              submitted
                ? "border-ds-status-success bg-ds-status-success-bg text-ds-status-success-text"
                : "border-ds-status-warning bg-ds-status-warning-bg text-ds-status-warning-text"
            }`}
          >
            {submitted ? "Submitted" : "Awaiting answers"}
          </span>
        </div>
        <dl className="mt-3 space-y-2">
          {fields.map((field) => {
            const value = answers?.[field.key];
            const text = Array.isArray(value)
              ? value.join(", ")
              : typeof value === "string"
                ? value
                : "";
            return (
              <div key={field.key} className="rounded-ds-md border border-ds-border-base p-3">
                <dt className="text-xs font-medium uppercase tracking-[0.15em] text-ds-text-tertiary">
                  {field.label || field.key}
                </dt>
                <dd className="mt-1 break-words text-sm text-ds-text-primary">
                  {text || <span className="text-ds-text-tertiary">Not answered</span>}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-ds-text-primary">
        What the seller needs from you
      </h3>
      <p className="mt-1 text-sm text-ds-text-secondary">
        Answer the required fields so work can start. Answers are shared with the seller only.
      </p>

      {showMissing && missing.length > 0 ? (
        <p
          role="alert"
          className="mt-3 rounded-ds-md border border-ds-status-error bg-ds-status-error-bg p-3 text-sm text-ds-status-error-text"
        >
          {missing.length} required {missing.length === 1 ? "answer is" : "answers are"} still
          missing.
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {fields.map((field) => {
          const value = draft[field.key];
          const scalar = Array.isArray(value) ? value.join(", ") : (value ?? "");
          const required = isRequiredField(field);
          const error = issueFor(field.key);

          return (
            <div key={field.key}>
              <label
                htmlFor={`requirement-${field.key}`}
                className="mb-1 block text-sm font-medium text-ds-text-primary"
              >
                {field.label || field.key}
                {required ? (
                  <span className="ml-1 text-ds-status-error-text" aria-hidden="true">
                    *
                  </span>
                ) : (
                  <span className="ml-1 text-xs font-normal text-ds-text-tertiary">(optional)</span>
                )}
              </label>

              {field.type === "SELECT" ? (
                <Select
                  id={`requirement-${field.key}`}
                  className="w-full"
                  value={scalar || undefined}
                  placeholder="Select an option"
                  options={(field.options ?? []).map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  onChange={(next) => setValue(field.key, next as string)}
                />
              ) : field.type === "FILE" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id={`requirement-${field.key}`}
                    value={scalar}
                    onChange={(event) => setValue(field.key, event.target.value)}
                    placeholder="https://link-to-your-file"
                    maxLength={SERVICE_LIMITS.answerMax}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={uploadingKey === field.key}
                    onClick={() => void handleUpload(field)}
                  >
                    Upload file
                  </Button>
                </div>
              ) : (
                <Input
                  id={`requirement-${field.key}`}
                  value={scalar}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  maxLength={SERVICE_LIMITS.answerMax}
                />
              )}

              {error ? (
                <p className="mt-1 text-xs text-ds-status-error-text">{error}</p>
              ) : null}
              {field.type === "FILE" && scalar ? (
                <a
                  href={scalar}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-ds-text-brand hover:underline"
                >
                  Open attached file
                </a>
              ) : null}
            </div>
          );
        })}
      </div>

      {uploadError ? (
        <p className="mt-3 text-xs text-ds-status-error-text">{uploadError}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          loading={submitting}
          disabled={showMissing && missing.length > 0}
        >
          Submit requirements
        </Button>
        <p className="text-xs text-ds-text-secondary">
          {missing.length === 0
            ? "All required answers provided."
            : `${missing.length} required ${missing.length === 1 ? "answer" : "answers"} remaining.`}
        </p>
      </div>
    </div>
  );
}

export default ServiceRequirementsForm;
