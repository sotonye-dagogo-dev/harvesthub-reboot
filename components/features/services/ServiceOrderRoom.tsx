"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  createOrderRoomPoller,
  type OrderRoomPoller,
} from "@/lib/services/orderRoomTransport";
import type { ServiceRequirementField } from "@/lib/types";
import { ServiceTimeline } from "./ServiceTimeline";
import { ServiceCountdown } from "./ServiceCountdown";
import {
  ServiceRequirementsForm,
  type RequirementAnswers,
} from "./ServiceRequirementsForm";
import {
  OrderRoomChat,
  type OrderRoomMessage,
  type SendMessagePayload,
} from "./OrderRoomChat";
import { ServiceDeliveryModal } from "./ServiceDeliveryModal";
import { ServiceRevisionPanel } from "./ServiceRevisionPanel";

export interface ServiceOrderItemView {
  id: string;
  listingType?: string | null;
  serviceConfig?: unknown;
  requirementAnswers?: unknown;
  requirementsSubmittedAt?: string | null;
  deadlineAt?: string | null;
  revisionsRemaining?: number | null;
}

export interface ServiceOrderView {
  id: string;
  status: string;
  paymentStatus: string;
  items?: ServiceOrderItemView[];
}

export function hasServiceItems(items?: ServiceOrderItemView[] | null): boolean {
  return (items ?? []).some((item) => item.listingType === "SERVICE");
}

/** `serviceKind` rule: every line item is a service (mixed carts take the product path). */
export function isServiceOnlyOrder(items?: ServiceOrderItemView[] | null): boolean {
  const list = items ?? [];
  return list.length > 0 && list.every((item) => item.listingType === "SERVICE");
}

export function parseServiceConfig(config: unknown): {
  requirementFields?: ServiceRequirementField[];
} {
  if (!config || typeof config !== "object") return {};
  const candidate = config as { requirementFields?: unknown };
  if (!Array.isArray(candidate.requirementFields)) return {};
  return {
    requirementFields: candidate.requirementFields.filter(
      (field): field is ServiceRequirementField =>
        Boolean(field) && typeof field === "object" && typeof (field as { key?: unknown }).key === "string",
    ),
  };
}

export function pickRequirementFields(items: ServiceOrderItemView[]): ServiceRequirementField[] {
  const seen = new Set<string>();
  const fields: ServiceRequirementField[] = [];
  for (const item of items) {
    for (const field of parseServiceConfig(item.serviceConfig).requirementFields ?? []) {
      if (seen.has(field.key)) continue;
      seen.add(field.key);
      fields.push(field);
    }
  }
  return fields;
}

export function normalizeAnswers(raw: unknown): RequirementAnswers {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const answers: RequirementAnswers = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") answers[key] = value;
    else if (Array.isArray(value)) answers[key] = value.filter((entry) => typeof entry === "string");
  }
  return answers;
}

export function mergeAnswers(items: ServiceOrderItemView[]): RequirementAnswers {
  return items.reduce<RequirementAnswers>(
    (merged, item) => ({ ...merged, ...normalizeAnswers(item.requirementAnswers) }),
    {},
  );
}

export function pickSubmittedAt(items: ServiceOrderItemView[]): string | null {
  for (const item of items) {
    if (item.requirementsSubmittedAt) return item.requirementsSubmittedAt;
  }
  return null;
}

/** Earliest armed deadline across the service line items. */
export function pickDeadlineAt(items: ServiceOrderItemView[]): string | null {
  const deadlines = items
    .map((item) => item.deadlineAt)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => ({ value, at: new Date(value).getTime() }))
    .filter((entry) => !Number.isNaN(entry.at))
    .sort((a, b) => a.at - b.at);
  return deadlines[0]?.value ?? null;
}

/**
 * Revision credits left. `null` when any service item leaves them untracked
 * (legacy `null` = hide the revision UI rather than guess).
 */
export function pickRevisionsRemaining(items: ServiceOrderItemView[]): number | null {
  let current: number | null = null;
  for (const item of items) {
    if (item.revisionsRemaining === null || item.revisionsRemaining === undefined) return null;
    current = current === null ? item.revisionsRemaining : Math.min(current, item.revisionsRemaining);
  }
  return current;
}

function mergeMessages(existing: OrderRoomMessage[], incoming: OrderRoomMessage[]): OrderRoomMessage[] {
  const byId = new Map<string, OrderRoomMessage>();
  for (const entry of [...existing, ...incoming]) byId.set(entry.id, entry);
  return [...byId.values()].sort((a, b) => {
    const left = new Date(a.createdAt).getTime();
    const right = new Date(b.createdAt).getTime();
    if (left !== right) return left - right;
    return a.id.localeCompare(b.id);
  });
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export interface ServiceOrderRoomProps {
  orderId: string;
  /** The shared order page re-reads the order after room mutations. */
  onOrderMutated?: () => void;
}

export function ServiceOrderRoom({ orderId, onOrderMutated }: ServiceOrderRoomProps) {
  const { user } = useAuth();
  const role = (user?.role as string | undefined) ?? null;
  const userId = user?.id ?? null;

  const [order, setOrder] = useState<ServiceOrderView | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [messages, setMessages] = useState<OrderRoomMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const lastMessageIdRef = useRef<string | null>(null);

  const loadOrder = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { signal });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          order?: ServiceOrderView;
          error?: string;
        };
        if (!res.ok || !data?.order) {
          throw new Error(data?.error || "Unable to load the order.");
        }
        setOrder(data.order);
        setOrderError(null);
      } catch (error) {
        if (isAbort(error)) return;
        setOrderError(error instanceof Error ? error.message : "Unable to load the order.");
      } finally {
        setLoadingOrder(false);
      }
    },
    [orderId],
  );

  const loadMessages = useCallback(
    async (signal?: AbortSignal) => {
      const after = lastMessageIdRef.current;
      try {
        const res = await fetch(
          `/api/orders/${orderId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`,
          { signal },
        );
        if (res.status === 403) {
          setChatError("You are not a participant in this order.");
          return;
        }
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          messages?: OrderRoomMessage[];
          error?: string;
        };
        if (!res.ok) throw new Error(data?.error || "Unable to load messages.");
        const incoming = Array.isArray(data.messages) ? data.messages : [];
        setChatError(null);
        setMessages((prev) => mergeMessages(after ? prev : [], incoming));
        if (incoming.length > 0) {
          const newest = incoming[incoming.length - 1];
          if (newest) lastMessageIdRef.current = newest.id;
        }
      } catch (error) {
        if (isAbort(error)) return;
        setChatError(error instanceof Error ? error.message : "Unable to load messages.");
      }
    },
    [orderId],
  );

  const poller: OrderRoomPoller = useMemo(
    () =>
      createOrderRoomPoller({
        task: async ({ signal }) => {
          await Promise.all([loadOrder(signal), loadMessages(signal)]);
        },
      }),
    [loadOrder, loadMessages],
  );

  useEffect(() => {
    poller.start();
    return () => poller.stop();
  }, [poller]);

  const afterMutation = useCallback(async () => {
    await poller.refresh();
    onOrderMutated?.();
  }, [onOrderMutated, poller]);

  const sendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      setSending(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: payload.body, attachments: payload.attachments }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          message?: OrderRoomMessage;
          error?: string;
          code?: string;
        };
        if (res.status === 403 || data?.code === "NOT_ORDER_PARTICIPANT") {
          const notice = "You are not a participant in this order.";
          setChatError(notice);
          throw new Error(notice);
        }
        if (!res.ok || data?.success === false || !data?.message) {
          throw new Error(data?.error || "Unable to send message.");
        }
        setChatError(null);
        setMessages((prev) => mergeMessages(prev, [data.message as OrderRoomMessage]));
        lastMessageIdRef.current = data.message.id;
      } finally {
        setSending(false);
      }
    },
    [orderId],
  );

  const rawItems = order?.items;
  const items = useMemo(() => rawItems ?? [], [rawItems]);
  const serviceItems = useMemo(
    () => items.filter((item) => item.listingType === "SERVICE"),
    [items],
  );
  const serviceOnly = isServiceOnlyOrder(items);
  const fields = useMemo(() => pickRequirementFields(serviceItems), [serviceItems]);
  const answers = useMemo(() => mergeAnswers(serviceItems), [serviceItems]);
  const submittedAt = pickSubmittedAt(serviceItems);
  const deadlineAt = pickDeadlineAt(serviceItems);
  const revisionsRemaining = pickRevisionsRemaining(serviceItems);
  const status = order?.status ?? null;

  const canSubmitRequirements =
    role === "BUYER" && status === "AWAITING_REQUIREMENTS" && serviceOnly;
  const showCountdown =
    Boolean(deadlineAt) || status === "IN_PROGRESS" || status === "IN_REVIEW";

  if (!order && loadingOrder) {
    return (
      <div className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4 sm:p-6">
        <p className="text-sm text-ds-text-secondary">Loading order room…</p>
      </div>
    );
  }

  if (order && !hasServiceItems(serviceItems)) return null;

  return (
    <div className="space-y-6" data-testid="service-order-room">
      {orderError ? (
        <p
          role="alert"
          className="rounded-ds-md border border-ds-status-error bg-ds-status-error-bg p-3 text-sm text-ds-status-error-text"
        >
          {orderError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <ServiceTimeline status={status} />
          </Card>

          {showCountdown ? (
            <ServiceCountdown
              deadlineAt={deadlineAt}
              label={status === "IN_PROGRESS" ? "Time left to deliver" : "Delivery countdown"}
            />
          ) : null}

          {status === "AWAITING_REQUIREMENTS" && fields.length > 0 ? (
            <div className="border-ds-border-brand bg-ds-brand-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-text-brand">
                Requirements gate
              </p>
              <p className="mt-1 text-sm text-ds-text-primary">
                {canSubmitRequirements
                  ? "Answer the questions below so the seller can start. Work begins once you submit."
                  : "Waiting for the buyer to submit their requirements before work can start."}
              </p>
            </div>
          ) : null}

          {fields.length > 0 ? (
            <Card>
              <ServiceRequirementsForm
                orderId={orderId}
                fields={fields}
                answers={answers}
                submittedAt={submittedAt}
                gating={serviceOnly}
                canSubmit={canSubmitRequirements}
                onSubmitted={() => void afterMutation()}
                uploadScope={{ userId: userId ?? undefined }}
              />
            </Card>
          ) : null}

          <ServiceDeliveryModal
            orderId={orderId}
            role={role}
            status={status}
            onDelivered={() => void afterMutation()}
          />

          <ServiceRevisionPanel
            orderId={orderId}
            role={role}
            status={status}
            paymentStatus={order?.paymentStatus ?? null}
            revisionsRemaining={revisionsRemaining}
            onRevised={() => void afterMutation()}
            onApproved={() => void afterMutation()}
          />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <OrderRoomChat
              messages={messages}
              currentUserId={userId}
              loading={loadingOrder}
              sending={sending}
              error={chatError}
              canSend={!chatError}
              onSend={sendMessage}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ServiceOrderRoom;
