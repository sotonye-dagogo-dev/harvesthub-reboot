import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  deriveTimelineState,
  SERVICE_TIMELINE_STEPS,
  ServiceTimeline,
} from "@/components/features/services/ServiceTimeline";

vi.mock("@/lib/hooks/useOptionList", () => ({
  useOptionList: () => ({
    options: [],
    visible: [],
    loading: false,
    fallback: true,
    error: null,
    refresh: vi.fn(),
  }),
}));

describe("deriveTimelineState", () => {
  it("covers the five service statuses in lifecycle order", () => {
    expect(SERVICE_TIMELINE_STEPS.map((step) => step.status)).toEqual([
      "PENDING",
      "AWAITING_REQUIREMENTS",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DELIVERED",
    ]);
  });

  it("marks earlier steps complete, the current one current, the rest pending", () => {
    const state = deriveTimelineState("IN_PROGRESS");
    expect(state.phase).toBe("service");
    expect(state.activeIndex).toBe(2);
    expect(state.states).toEqual(["complete", "complete", "current", "pending", "pending"]);
  });

  it("treats the first status as the only current step", () => {
    const state = deriveTimelineState("PENDING");
    expect(state.activeIndex).toBe(0);
    expect(state.states[0]).toBe("current");
    expect(state.states.slice(1).every((entry) => entry === "pending")).toBe(true);
  });

  it("skips every step for terminal statuses", () => {
    for (const status of ["CANCELLED", "REFUNDED"]) {
      const state = deriveTimelineState(status);
      expect(state.phase).toBe(status === "CANCELLED" ? "cancelled" : "refunded");
      expect(state.activeIndex).toBe(-1);
      expect(state.states.every((entry) => entry === "skipped")).toBe(true);
    }
  });

  it("never invents progress for product-path statuses", () => {
    const state = deriveTimelineState("PROCESSING");
    expect(state.phase).toBe("unknown");
    expect(state.activeIndex).toBe(-1);
    expect(state.states.every((entry) => entry === "pending")).toBe(true);
  });
});

describe("ServiceTimeline", () => {
  it("labels steps from the serviceMilestones option list", () => {
    render(
      <ServiceTimeline
        status="PENDING"
        milestones={[{ value: "ORDERED", label: "Order received" }]}
      />,
    );
    expect(screen.getByText("Order received")).toBeInTheDocument();
    expect(screen.getByText("Current step — Order placed and payment received.")).toBeInTheDocument();
  });

  it("falls back to the built-in milestone label", () => {
    render(<ServiceTimeline status="IN_REVIEW" milestones={[]} />);
    expect(screen.getByText("In review")).toBeInTheDocument();
  });
});
