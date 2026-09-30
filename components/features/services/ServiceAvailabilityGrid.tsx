"use client";

import { Button, Input, Switch } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import type { SlotDraft } from "./wizardModel";
import { errorFor, type StepFieldError } from "./steps/stepShared";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface ServiceAvailabilityGridProps {
  slots: SlotDraft[];
  errors: StepFieldError[];
  onChange: (slots: SlotDraft[]) => void;
  disabled?: boolean;
}

function nextSlotId(slots: SlotDraft[]): string {
  return `slot-${Date.now().toString(36)}-${slots.length}`;
}

/**
 * Weekly availability editor for on-site services.
 *
 * One card per weekday; each card holds the time ranges the vendor accepts.
 * The payload is exactly what `serviceSlotSchema` validates (day 0-6, 24h
 * start/end, end after start), capped at 168 rows in total.
 */
export function ServiceAvailabilityGrid({
  slots,
  errors,
  onChange,
  disabled,
}: ServiceAvailabilityGridProps) {
  const updateSlot = (index: number, patch: Partial<SlotDraft>) => {
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  const addSlot = (dayOfWeek: number) => {
    if (slots.length >= 168) return;
    onChange([
      ...slots,
      { id: nextSlotId(slots), dayOfWeek, startTime: "09:00", endTime: "17:00", isAvailable: true },
    ]);
  };

  const rootError = errorFor(errors, "availableSlots");

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ds-text-secondary">
          {slots.length}/168 slots this week. Buyers can only book inside these windows.
        </p>
        {rootError ? (
          <p className="text-xs text-ds-status-error-text">{rootError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAY_LABELS.map((day, dayOfWeek) => {
          const entries = slots
            .map((slot, index) => ({ slot, index }))
            .filter((entry) => entry.slot.dayOfWeek === dayOfWeek);
          const anyAvailable = entries.some((entry) => entry.slot.isAvailable);

          return (
            <div
              key={day}
              className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-3 shadow-ds-xs"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ds-text-primary">{day}</span>
                {entries.length > 0 ? (
                  <Switch
                    size="small"
                    checked={anyAvailable}
                    disabled={disabled}
                    aria-label={`Availability for ${day}`}
                    onChange={(checked) =>
                      onChange(
                        slots.map((slot) =>
                          slot.dayOfWeek === dayOfWeek ? { ...slot, isAvailable: checked } : slot,
                        ),
                      )
                    }
                  />
                ) : null}
              </div>

              {entries.length === 0 ? (
                <p className="text-xs text-ds-text-tertiary">Not available</p>
              ) : (
                <ul className="space-y-2">
                  {entries.map(({ slot, index }) => {
                    const startError = errorFor(errors, `availableSlots.${index}.startTime`);
                    const endError = errorFor(errors, `availableSlots.${index}.endTime`);

                    return (
                      <li key={slot.id} className="flex items-end gap-2">
                        <label className="min-w-0 flex-1 space-y-1">
                          <span className="block text-[11px] text-ds-text-tertiary">From</span>
                          <Input
                            type="time"
                            size="small"
                            value={slot.startTime}
                            disabled={disabled}
                            status={startError ? "error" : undefined}
                            onChange={(event) => updateSlot(index, { startTime: event.target.value })}
                          />
                        </label>
                        <label className="min-w-0 flex-1 space-y-1">
                          <span className="block text-[11px] text-ds-text-tertiary">To</span>
                          <Input
                            type="time"
                            size="small"
                            value={slot.endTime}
                            disabled={disabled}
                            status={endError ? "error" : undefined}
                            onChange={(event) => updateSlot(index, { endTime: event.target.value })}
                          />
                        </label>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label={`Remove ${DAY_SHORT[dayOfWeek]} ${slot.startTime} slot`}
                          disabled={disabled}
                          onClick={() => removeSlot(index)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}

              <Button
                type="dashed"
                size="small"
                block
                icon={<PlusOutlined />}
                className="mt-2"
                disabled={disabled || slots.length >= 168}
                onClick={() => addSlot(dayOfWeek)}
              >
                Add time
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-ds-text-tertiary">
        Up to {SERVICE_LIMITS.deliveryDaysMax} days of delivery time applies to every slot.
      </p>
    </div>
  );
}

export default ServiceAvailabilityGrid;
