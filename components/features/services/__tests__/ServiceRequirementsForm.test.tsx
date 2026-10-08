import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ServiceRequirementsForm,
  collectMissingAnswers,
  hasCompleteAnswers,
} from "@/components/features/services/ServiceRequirementsForm";
import type { ServiceRequirementField } from "@/lib/types";

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/contexts/ToastContext", () => ({
  useToast: () => toastMock,
}));

const fields: ServiceRequirementField[] = [
  { key: "BRAND_NAME", label: "Brand name", type: "TEXT", required: true },
  { key: "COLORS", label: "Preferred colours", type: "SELECT", options: ["Blue"], required: false },
];

describe("requirements gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats missing required answers as incomplete and optional ones as skippable", () => {
    expect(collectMissingAnswers(fields, {})).toEqual(["BRAND_NAME"]);
    expect(collectMissingAnswers(fields, { BRAND_NAME: "Harvest Hub" })).toEqual([]);
    expect(hasCompleteAnswers(fields, { BRAND_NAME: "   " })).toBe(false);
    expect(hasCompleteAnswers(fields, { BRAND_NAME: "Harvest Hub" })).toBe(true);
  });

  it("blocks submit and does not hit the API while a required answer is missing", async () => {
    render(
      <ServiceRequirementsForm orderId="order-1" fields={fields} canSubmit onSubmitted={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /submit requirements/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "1 required answer is still missing.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts { answers } once every required field is answered", async () => {
    const onSubmitted = vi.fn();
    render(
      <ServiceRequirementsForm
        orderId="order-1"
        fields={fields}
        canSubmit
        onSubmitted={onSubmitted}
      />,
    );

    fireEvent.change(screen.getByLabelText(/brand name/i), {
      target: { value: "Sunrise Farms" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit requirements/i }));

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(
      "/api/orders/order-1/requirements",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answers: { BRAND_NAME: "Sunrise Farms" } }),
      }),
    );
    await vi.waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
  });

  it("renders answers read-only when the buyer cannot submit", () => {
    render(
      <ServiceRequirementsForm
        orderId="order-1"
        fields={fields}
        answers={{ BRAND_NAME: "Sunrise Farms" }}
        submittedAt="2026-10-01T10:00:00.000Z"
        canSubmit={false}
      />,
    );

    expect(screen.getByText("Sunrise Farms")).toBeInTheDocument();
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit requirements/i })).not.toBeInTheDocument();
  });

  it("surfaces REQUIREMENTS_INVALID issues returned by the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          code: "REQUIREMENTS_INVALID",
          error: "Requirements are incomplete.",
          issues: [{ key: "BRAND_NAME", message: "This answer is too short." }],
        }),
      }),
    );

    render(
      <ServiceRequirementsForm orderId="order-1" fields={fields} canSubmit onSubmitted={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText(/brand name/i), { target: { value: "Sun" } });
    fireEvent.click(screen.getByRole("button", { name: /submit requirements/i }));

    expect(await screen.findByText("This answer is too short.")).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalled();
  });
});
