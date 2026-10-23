"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/lib/contexts/ToastContext";
import { UserRole } from "@/lib/constants";

/**
 * One accepted revision burns one credit. `null` means "not tracked" (legacy
 * rows / unlimited) — the revision UI is hidden rather than guessing a number.
 */
export function nextRevisionCount(
  current: number | null | undefined,
): number | null {
  if (current === null || current === undefined) return null;
  return Math.max(0, current - 1);
}

export function canBuyerRevise(
  role: string | null | undefined,
  status: string | null | undefined,
  revisionsRemaining: number | null | undefined,
): boolean {
  return (
    role === UserRole.BUYER &&
    status === "IN_REVIEW" &&
    typeof revisionsRemaining === "number" &&
    revisionsRemaining > 0
  );
}

export function canBuyerApprove(
  role: string | null | undefined,
  status: string | null | undefined,
  paymentStatus?: string | null,
): boolean {
  return (
    role === UserRole.BUYER && status === "IN_REVIEW" && paymentStatus === "PAID"
  );
}

export interface ServiceRevisionPanelProps {
  orderId: string;
  role?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  /** `null` = revisions not tracked for this order → revision UI hidden. */
  revisionsRemaining?: number | null;
  /** Called after a successful revision request, with the decremented count. */
  onRevised?: (next: number | null) => void;
  /** Called after "Accept delivery & release" succeeds. */
  onApproved?: () => void;
}

export function ServiceRevisionPanel({
  orderId,
  role,
  status,
  paymentStatus,
  revisionsRemaining,
  onRevised,
  onApproved,
}: ServiceRevisionPanelProps) {
  const toast = useToast();
  const [remaining, setRemaining] = useState<number | null>(
    revisionsRemaining ?? null,
  );
  const [busy, setBusy] = useState<"revision" | "approve" | null>(null);

  useEffect(() => {
    setRemaining(revisionsRemaining ?? null);
  }, [revisionsRemaining]);

  const isBuyer = role === UserRole.BUYER;
  const inReview = status === "IN_REVIEW";
  if (!isBuyer || !inReview) return null;

  const approve = canBuyerApprove(role, status, paymentStatus);
  const tracked = typeof remaining === "number";
  const revise = canBuyerRevise(role, status, remaining);

  const requestRevision = async () => {
    if (busy) return;
    setBusy("revision");
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          note: "Buyer requested a revision from the order room.",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Unable to request a revision.");
      }
      const next = nextRevisionCount(remaining);
      setRemaining(next);
      toast.success("Revision requested. The seller has been notified.");
      onRevised?.(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request a revision.");
    } finally {
      setBusy(null);
    }
  };

  const approveDelivery = async () => {
    if (busy) return;
    setBusy("approve");
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-delivery`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Unable to confirm delivery.");
      }
      toast.success(data?.message || "Delivery accepted and funds released.");
      onApproved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm delivery.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-ds-md border border-ds-border-base p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ds-text-primary">Review the delivery</h3>
        {tracked ? (
          <span className="rounded-ds-full border border-ds-border-base bg-ds-surface-sunken px-2 py-0.5 text-[11px] font-semibold text-ds-text-secondary">
            {remaining} revision{remaining === 1 ? "" : "s"} remaining
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-ds-text-secondary">
        Accept the delivery to release payment, or send it back for one more round.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {approve ? (
          <Button
            type="button"
            loading={busy === "approve"}
            disabled={busy !== null}
            onClick={() => void approveDelivery()}
          >
            Accept delivery &amp; release
          </Button>
        ) : null}

        {tracked ? (
          <Button
            type="button"
            variant="outline"
            loading={busy === "revision"}
            disabled={busy !== null || !revise}
            onClick={() => void requestRevision()}
          >
            Request revision
          </Button>
        ) : null}
      </div>

      {tracked && remaining === 0 ? (
        <p className="mt-2 text-xs text-ds-status-warning-text">
          No revisions remaining — accept the delivery or request a refund.
        </p>
      ) : null}
      {!tracked ? (
        <p className="mt-2 text-xs text-ds-text-tertiary">
          Revisions are not tracked for this order.
        </p>
      ) : null}
    </div>
  );
}

export default ServiceRevisionPanel;
