"use client";

import { useRef, useState } from "react";
import { Input } from "antd";
import { Button } from "@/components/ui";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import { uploadOrderAttachment, type OrderAttachment } from "./ServiceOrderRoom.upload";

export interface OrderRoomMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
}

export interface SendMessagePayload {
  body: string;
  attachments: OrderAttachment[];
}

export interface OrderRoomChatProps {
  messages: OrderRoomMessage[];
  currentUserId?: string | null;
  loading?: boolean;
  sending?: boolean;
  /** Non-participant / transport failure notice. */
  error?: string | null;
  canSend?: boolean;
  emptyHint?: string;
  onSend: (payload: SendMessagePayload) => Promise<void> | void;
  uploadScope?: { userId?: string; vendorId?: string };
}

const ROLE_LABELS: Record<string, string> = {
  BUYER: "Buyer",
  VENDOR: "Seller",
  ADMIN: "Admin",
};

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export function OrderRoomChat({
  messages,
  currentUserId,
  loading = false,
  sending = false,
  error,
  canSend = true,
  emptyHint = "No messages yet. Use this thread to share files, links and progress updates.",
  onSend,
  uploadScope,
}: OrderRoomChatProps) {
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<OrderAttachment | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const composerDisabled = !canSend || sending;

  const handlePickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    try {
      setAttachment(await uploadOrderAttachment(file, uploadScope));
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error ? uploadFailure.message : "Unable to upload attachment.",
      );
    }
  };

  const handleSend = async () => {
    if (composerDisabled) return;
    const body = draft.trim();
    if (!body && !attachment) return;
    setSendError(null);
    try {
      await onSend({ body, attachments: attachment ? [attachment] : [] });
      setDraft("");
      setAttachment(null);
    } catch (failure) {
      setSendError(failure instanceof Error ? failure.message : "Unable to send message.");
    }
  };

  return (
    <section className="flex h-full min-h-[22rem] flex-col" aria-label="Order chat">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ds-text-primary">Order chat</h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ds-text-tertiary">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-3">
        {error ? (
          <p
            role="alert"
            className="rounded-ds-md border border-ds-status-error bg-ds-status-error-bg p-3 text-sm text-ds-status-error-text"
          >
            {error}
          </p>
        ) : null}

        {!error && loading && messages.length === 0 ? (
          <p className="text-sm text-ds-text-secondary">Loading messages…</p>
        ) : null}

        {!error && !loading && messages.length === 0 ? (
          <p className="text-sm text-ds-text-secondary">{emptyHint}</p>
        ) : null}

        {messages.map((entry) => {
          const mine = Boolean(currentUserId) && entry.senderId === currentUserId;
          return (
            <div key={entry.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-ds-md border p-3 ${
                  mine
                    ? "border-ds-border-brand bg-ds-brand-surface"
                    : "border-ds-border-base bg-ds-surface-base"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ds-text-tertiary">
                  {ROLE_LABELS[entry.senderRole] ?? entry.senderRole} · {formatTime(entry.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ds-text-primary">
                  {entry.body}
                </p>
                {entry.attachmentUrl ? (
                  <a
                    href={entry.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center rounded-ds-sm border border-ds-border-base bg-ds-surface-base px-2 py-1 text-xs text-ds-text-brand hover:underline"
                  >
                    {entry.attachmentName || "Open attachment"}
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {canSend ? (
        <div className="mt-3 space-y-2">
          {attachment ? (
            <div className="flex flex-wrap items-center gap-2 rounded-ds-md border border-ds-border-base p-2">
              <span className="truncate text-xs text-ds-text-primary">{attachment.name}</span>
              <button
                type="button"
                className="text-xs text-ds-status-error-text hover:underline"
                onClick={() => setAttachment(null)}
              >
                Remove
              </button>
            </div>
          ) : null}

          <Input.TextArea
            rows={3}
            value={draft}
            maxLength={SERVICE_LIMITS.answerMax}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message to the other party…"
            aria-label="Message"
          />

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              void handlePickFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={composerDisabled || Boolean(attachment)}
            >
              Attach file
            </Button>
            <Button
              type="button"
              size="sm"
              loading={sending}
              disabled={composerDisabled || (!draft.trim() && !attachment)}
              onClick={() => void handleSend()}
            >
              Send
            </Button>
          </div>

          {uploadError ? <p className="text-xs text-ds-status-error-text">{uploadError}</p> : null}
          {sendError ? <p className="text-xs text-ds-status-error-text">{sendError}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-xs text-ds-text-tertiary">
          Only order participants can post messages here.
        </p>
      )}
    </section>
  );
}

export default OrderRoomChat;
