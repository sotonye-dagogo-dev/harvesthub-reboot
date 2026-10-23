"use client";

import { useOptionList } from "@/lib/hooks/useOptionList";
import type { OptionRow } from "@/lib/config/optionLists";

export interface TimelineStep {
  /** Order status that marks this step as current. */
  status: string;
  /** `serviceMilestones` option-list value whose label overrides the default. */
  milestone: string;
  fallbackLabel: string;
  hint: string;
}

/**
 * The five service order statuses, in lifecycle order. Labels come from the
 * admin-editable `serviceMilestones` option list (fallback rows below).
 */
export const SERVICE_TIMELINE_STEPS: TimelineStep[] = [
  {
    status: "PENDING",
    milestone: "ORDERED",
    fallbackLabel: "Ordered",
    hint: "Order placed and payment received.",
  },
  {
    status: "AWAITING_REQUIREMENTS",
    milestone: "REQUIREMENTS_SUBMITTED",
    fallbackLabel: "Requirements submitted",
    hint: "Buyer supplies what the seller needs before work starts.",
  },
  {
    status: "IN_PROGRESS",
    milestone: "WORK_STARTED",
    fallbackLabel: "Work started",
    hint: "Seller is working against the delivery deadline.",
  },
  {
    status: "IN_REVIEW",
    milestone: "IN_REVIEW",
    fallbackLabel: "In review",
    hint: "Delivery submitted — buyer accepts or requests a revision.",
  },
  {
    status: "DELIVERED",
    milestone: "COMPLETE",
    fallbackLabel: "Complete",
    hint: "Buyer accepted the delivery and funds were released.",
  },
];

export type TimelineStepState = "complete" | "current" | "pending" | "skipped";

export type TimelinePhase = "service" | "cancelled" | "refunded" | "unknown";

export interface TimelineState {
  activeIndex: number;
  states: TimelineStepState[];
  phase: TimelinePhase;
}

/**
 * Derive each milestone's state from the order status.
 *
 * - service statuses → steps before it are `complete`, it is `current`, the
 *   rest are `pending`;
 * - CANCELLED / REFUNDED → every step is `skipped`;
 * - any other status (product-path statuses on a mixed cart) → all `pending`
 *   with `phase: "unknown"`, so the room renders a neutral timeline instead of
 *   pretending progress it cannot see.
 */
export function deriveTimelineState(
  status: string | null | undefined,
): TimelineState {
  const value = (status ?? "").trim().toUpperCase();
  const activeIndex = SERVICE_TIMELINE_STEPS.findIndex((step) => step.status === value);

  if (activeIndex === -1) {
    const phase: TimelinePhase =
      value === "CANCELLED"
        ? "cancelled"
        : value === "REFUNDED"
          ? "refunded"
          : "unknown";
    const state: TimelineStepState = phase === "unknown" ? "pending" : "skipped";
    return {
      activeIndex: -1,
      states: SERVICE_TIMELINE_STEPS.map(() => state),
      phase,
    };
  }

  return {
    activeIndex,
    states: SERVICE_TIMELINE_STEPS.map((_, index) => {
      if (index < activeIndex) return "complete";
      if (index === activeIndex) return "current";
      return "pending";
    }),
    phase: "service",
  };
}

const CHIP_CLASSES: Record<TimelineStepState, string> = {
  complete: "border-ds-border-brand bg-ds-brand-subtle text-ds-text-primary",
  current: "border-ds-brand-primary bg-ds-brand-primary text-white",
  pending: "border-ds-border-base bg-ds-surface-sunken text-ds-text-secondary",
  skipped: "border-ds-border-base bg-ds-surface-sunken text-ds-text-tertiary",
};

const STATE_LABEL: Record<TimelineStepState, string> = {
  complete: "Completed",
  current: "Current step",
  pending: "Upcoming",
  skipped: "Not applicable",
};

const PHASE_NOTE: Record<TimelinePhase, string | null> = {
  service: null,
  cancelled: "This order was cancelled — no further milestones apply.",
  refunded: "This order was refunded — no further milestones apply.",
  unknown: "Standard delivery tracking applies to this order.",
};

export interface ServiceTimelineProps {
  status?: string | null;
  /** Override the milestone labels (tests); defaults to the option list. */
  milestones?: OptionRow[];
  className?: string;
}

export function ServiceTimeline({ status, milestones, className }: ServiceTimelineProps) {
  const optionList = useOptionList("serviceMilestones");
  const rows = milestones ?? optionList.options;
  const timeline = deriveTimelineState(status);
  const phaseNote = PHASE_NOTE[timeline.phase];

  return (
    <section className={className} aria-label="Order timeline">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ds-text-primary">Fulfilment timeline</h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ds-text-tertiary">
          {optionList.loading ? "Loading steps" : `${SERVICE_TIMELINE_STEPS.length} steps`}
        </span>
      </div>

      <ol className="mt-4 space-y-3">
        {SERVICE_TIMELINE_STEPS.map((step, index) => {
          const state = timeline.states[index] ?? "pending";
          const label =
            rows.find((row) => row.value === step.milestone)?.label ?? step.fallbackLabel;
          return (
            <li
              key={step.milestone}
              className="flex items-start gap-3 rounded-ds-md border border-ds-border-base bg-ds-surface-base p-3"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-ds-full border text-[11px] font-semibold ${CHIP_CLASSES[state]}`}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ds-text-primary">{label}</p>
                  <span className="text-[11px] uppercase tracking-[0.15em] text-ds-text-tertiary">
                    {step.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ds-text-secondary">
                  {STATE_LABEL[state]} — {step.hint}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {phaseNote ? (
        <p className="mt-3 rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-3 text-xs text-ds-text-secondary">
          {phaseNote}
        </p>
      ) : null}
    </section>
  );
}

export default ServiceTimeline;
