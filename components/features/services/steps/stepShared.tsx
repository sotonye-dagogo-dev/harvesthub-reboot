"use client";

import { Form } from "antd";
import type { ReactNode } from "react";
import type { ServiceWizardValues } from "../wizardModel";

/** Field-level issues produced by `stepFieldErrors` (path + messages). */
export type StepFieldError = { name: (string | number)[]; errors: string[] };

export interface StepComponentProps {
  values: ServiceWizardValues;
  errors: StepFieldError[];
  onChange: (patch: Partial<ServiceWizardValues>) => void;
  /** Uploads need the vendor folder; admins pick one, vendors get their own. */
  vendorId?: string;
  /** Disables every control while a draft save is in flight. */
  disabled?: boolean;
}

/** First message for a dotted path (e.g. `geo`, `packages.0.title`). */
export function errorFor(errors: StepFieldError[], path: string): string | undefined {
  const match = errors.find((entry) => entry.name.join(".") === path);
  return match?.errors[0];
}

/**
 * Label + control + error slot. Errors come from the step schema
 * (`validateServiceStep` / `stepFieldErrors`) — never from antd rules, so a
 * rule can never drift from the server-side contract.
 */
export function Field({
  label,
  required,
  error,
  help,
  className,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  error?: string;
  help?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={error ? "error" : undefined}
      help={error ?? help ?? null}
      className={className ?? "mb-0"}
    >
      {children}
    </Form.Item>
  );
}

/** Section heading used inside a step (card title scale). */
export function StepSection({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="text-base font-semibold text-ds-text-primary">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-ds-text-secondary">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Wrapper so every step's fields share one antd form context. */
export function StepForm({ children }: { children: ReactNode }) {
  return (
    <Form layout="vertical" className="w-full">
      {children}
    </Form>
  );
}
