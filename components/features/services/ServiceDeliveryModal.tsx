"use client";

import { useState } from "react";
import { Input, Modal } from "antd";
import { Button } from "@/components/ui";
import { useToast } from "@/lib/contexts/ToastContext";
import { UserRole } from "@/lib/constants";

/**
 * The delivery CTA belongs to the seller: only the vendor (never the buyer,
 * never a viewer) can move `IN_PROGRESS → IN_REVIEW`.
 */
export function canSellerDeliver(
  role: string | null | undefined,
  status: string | null | undefined,
): boolean {
  return role === UserRole.VENDOR && status === "IN_PROGRESS";
}

export interface ServiceDeliveryModalProps {
  orderId: string;
  role?: string | null;
  status?: string | null;
  onDelivered?: () => void;
}

export function ServiceDeliveryModal({
  orderId,
  role,
  status,
  onDelivered,
}: ServiceDeliveryModalProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!canSellerDeliver(role, status)) return null;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_REVIEW", note: note.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Unable to submit the delivery.");
      }
      toast.success("Delivery submitted for the buyer's review.");
      setNote("");
      setOpen(false);
      onDelivered?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit the delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-ds-md border border-ds-border-base p-4">
      <h3 className="text-base font-semibold text-ds-text-primary">Ready to hand over?</h3>
      <p className="mt-1 text-sm text-ds-text-secondary">
        Submit your delivery to move the order to review. The buyer can then accept it or request
        a revision.
      </p>
      <Button type="button" className="mt-3" onClick={() => setOpen(true)}>
        Submit delivery
      </Button>

      <Modal
        title="Submit delivery"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
        okText="Submit for review"
        okButtonProps={{ loading: submitting }}
        cancelButtonProps={{ disabled: submitting }}
      >
        <div className="space-y-3">
          <p className="text-sm text-ds-text-secondary">
            Share what you delivered — files, links, or a short summary for the buyer.
          </p>
          <Input.TextArea
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Delivery notes (shared with the buyer)"
            maxLength={2000}
          />
        </div>
      </Modal>
    </div>
  );
}

export default ServiceDeliveryModal;
