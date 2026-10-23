"use client";

import { useEffect, useState } from "react";
import {
  SERVICE_COUNTDOWN_WARNING_HOURS,
  hoursUntil,
} from "@/lib/config/serviceFulfillment";

export type CountdownTone = "overdue" | "error" | "warning" | "ok" | "none";

/**
 * Tone for the remaining time.
 *
 * - negative            → overdue (error colour)
 * - `< warningHours`    → error colour (the configured threshold)
 * - `< warningHours ×2` → warning colour ("approaching")
 * - otherwise           → neutral
 *
 * Colour is never load-bearing: `COUNTDOWN_TONE_LABEL` is always rendered
 * alongside it.
 */
export function countdownTone(
  hours: number | null | undefined,
  warningHours: number = SERVICE_COUNTDOWN_WARNING_HOURS,
): CountdownTone {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return "none";
  if (hours < 0) return "overdue";
  if (hours < warningHours) return "error";
  if (hours < warningHours * 2) return "warning";
  return "ok";
}

export const COUNTDOWN_TONE_LABEL: Record<CountdownTone, string> = {
  overdue: "Overdue",
  error: "Urgent",
  warning: "Due soon",
  ok: "On track",
  none: "No deadline",
};

const TONE_CLASSES: Record<CountdownTone, string> = {
  overdue: "border-ds-status-error bg-ds-status-error-bg text-ds-status-error-text",
  error: "border-ds-status-error bg-ds-status-error-bg text-ds-status-error-text",
  warning: "border-ds-status-warning bg-ds-status-warning-bg text-ds-status-warning-text",
  ok: "border-ds-border-base bg-ds-surface-sunken text-ds-text-secondary",
  none: "border-ds-border-base bg-ds-surface-sunken text-ds-text-tertiary",
};

/** `2d 4h 5m` / `4h 5m` / `45m` — always carries the unit, never bare colour. */
export function formatRemaining(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(Math.abs(hours) * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingMinutes = totalMinutes % (60 * 24);
  const hrs = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(" ");
}

export interface ServiceCountdownProps {
  deadlineAt?: string | Date | null;
  /** Override the configured warning threshold (tests). */
  warningHours?: number;
  /** Fixed clock (tests); otherwise ticks every minute. */
  now?: Date;
  label?: string;
  className?: string;
}

export function ServiceCountdown({
  deadlineAt,
  warningHours = SERVICE_COUNTDOWN_WARNING_HOURS,
  now,
  label = "Delivery countdown",
  className,
}: ServiceCountdownProps) {
  const [clock, setClock] = useState<Date>(() => new Date());

  useEffect(() => {
    if (now) return undefined;
    const id = setInterval(() => setClock(new Date()), 60_000);
    return () => clearInterval(id);
  }, [now]);

  const resolvedNow = now ?? clock;
  const deadline = deadlineAt ? new Date(deadlineAt) : null;
  const validDeadline = deadline && !Number.isNaN(deadline.getTime()) ? deadline : null;
  const hours = validDeadline ? hoursUntil(validDeadline, resolvedNow) : undefined;
  const tone = countdownTone(hours, warningHours);

  let detail = "No delivery deadline has been set for this order.";
  if (validDeadline && hours !== undefined) {
    const dueText = `Due ${validDeadline.toLocaleString()}`;
    if (tone === "overdue") {
      detail = `Delivery was due ${validDeadline.toLocaleString()} — contact the seller.`;
    } else if (tone === "error") {
      detail = `Less than ${warningHours}h remaining. ${dueText}.`;
    } else if (tone === "warning") {
      detail = `Approaching the ${warningHours}h warning threshold. ${dueText}.`;
    } else {
      detail = dueText;
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-ds-md border p-3 ${TONE_CLASSES[tone]} ${className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">{label}</p>
        <p className="mt-0.5 text-sm font-semibold">{COUNTDOWN_TONE_LABEL[tone]}</p>
        <p className="mt-0.5 text-xs opacity-90">{detail}</p>
      </div>
      <p className="text-sm font-semibold tabular-nums">
        {validDeadline && hours !== undefined ? formatRemaining(hours) : "—"}
      </p>
    </div>
  );
}

export default ServiceCountdown;
