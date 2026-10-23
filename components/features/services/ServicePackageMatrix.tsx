"use client";

import { Button, Input, InputNumber, Tag } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { resolveOptionLabel } from "@/lib/config/optionLists";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import { errorFor, type StepFieldError } from "./steps/stepShared";
import type { PackageDraft } from "./wizardModel";

export interface ServicePackageMatrixProps {
  packages: PackageDraft[];
  errors: StepFieldError[];
  onChange: (packages: PackageDraft[]) => void;
  disabled?: boolean;
}

/**
 * The tier cards a service publishes with — price, delivery window, revisions
 * and extras, one column per tier (1 tier → one card, 3 tiers → three).
 *
 * Every number it edits is bounded by `SERVICE_LIMITS` so the draft always
 * satisfies `servicePackagesSchema` before it reaches the server.
 */
export function ServicePackageMatrix({
  packages,
  errors,
  onChange,
  disabled,
}: ServicePackageMatrixProps) {
  const updateAt = (index: number, patch: Partial<PackageDraft>) => {
    onChange(packages.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const updateExtra = (packageIndex: number, extraIndex: number, patch: Partial<{ title: string; price: number }>) => {
    onChange(
      packages.map((entry, i) =>
        i === packageIndex
          ? {
              ...entry,
              extras: entry.extras.map((extra, j) => (j === extraIndex ? { ...extra, ...patch } : extra)),
            }
          : entry,
      ),
    );
  };

  const columnClass =
    packages.length >= 3 ? "grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 gap-4 md:grid-cols-2";

  return (
    <div className={`grid ${columnClass}`}>
      {packages.map((entry, index) => (
        <div
          key={entry.tier}
          className="flex flex-col gap-3 rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4 shadow-ds-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <Tag color="purple" className="m-0">
              {resolveOptionLabel("serviceTiers", entry.tier) || entry.tier}
            </Tag>
            <span className="text-[11px] uppercase tracking-[0.2em] text-ds-text-tertiary">
              Tier {index + 1}
            </span>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-ds-text-secondary">Package title</span>
            <Input
              value={entry.title}
              disabled={disabled}
              maxLength={SERVICE_LIMITS.packageTitleMax}
              showCount
              placeholder="Logo design"
              status={errorFor(errors, `packages.${index}.title`) ? "error" : undefined}
              onChange={(event) => updateAt(index, { title: event.target.value })}
            />
            {errorFor(errors, `packages.${index}.title`) ? (
              <span className="block text-xs text-ds-status-error-text">
                {errorFor(errors, `packages.${index}.title`)}
              </span>
            ) : null}
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-ds-text-secondary">What is included</span>
            <Input.TextArea
              value={entry.description}
              disabled={disabled}
              rows={2}
              maxLength={SERVICE_LIMITS.packageDescriptionMax}
              showCount
              placeholder="Three concepts, two revisions, source files"
              onChange={(event) => updateAt(index, { description: event.target.value })}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-ds-text-secondary">Price (NGN)</span>
              <InputNumber
                value={entry.price}
                disabled={disabled}
                min={1}
                max={10_000_000}
                className="w-full"
                status={errorFor(errors, `packages.${index}.price`) ? "error" : undefined}
                onChange={(next) => updateAt(index, { price: Number(next ?? 0) })}
              />
              {errorFor(errors, `packages.${index}.price`) ? (
                <span className="block text-xs text-ds-status-error-text">
                  {errorFor(errors, `packages.${index}.price`)}
                </span>
              ) : null}
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-ds-text-secondary">Delivery (days)</span>
              <InputNumber
                value={entry.deliveryDays}
                disabled={disabled}
                min={SERVICE_LIMITS.deliveryDaysMin}
                max={SERVICE_LIMITS.deliveryDaysMax}
                className="w-full"
                status={errorFor(errors, `packages.${index}.deliveryDays`) ? "error" : undefined}
                onChange={(next) => updateAt(index, { deliveryDays: Number(next ?? 1) })}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-ds-text-secondary">Revisions</span>
              <InputNumber
                value={entry.revisions}
                disabled={disabled}
                min={SERVICE_LIMITS.revisionsMin}
                max={SERVICE_LIMITS.revisionsMax}
                className="w-full"
                status={errorFor(errors, `packages.${index}.revisions`) ? "error" : undefined}
                onChange={(next) => updateAt(index, { revisions: Number(next ?? 0) })}
              />
            </label>
          </div>

          <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ds-text-primary">Add-ons</span>
              <span className="text-[11px] text-ds-text-tertiary">
                {entry.extras.length}/{SERVICE_LIMITS.extrasMax}
              </span>
            </div>

            {entry.extras.length === 0 ? (
              <p className="text-xs text-ds-text-tertiary">No add-ons on this tier.</p>
            ) : (
              <ul className="space-y-2">
                {entry.extras.map((extra, extraIndex) => (
                  <li key={`extra-${extraIndex}`} className="flex items-center gap-2">
                    <Input
                      value={extra.title}
                      disabled={disabled}
                      maxLength={SERVICE_LIMITS.extraTitleMax}
                      placeholder="Extra name"
                      className="flex-1"
                      status={errorFor(errors, `packages.${index}.extras.${extraIndex}.title`) ? "error" : undefined}
                      onChange={(event) => updateExtra(index, extraIndex, { title: event.target.value })}
                    />
                    <InputNumber
                      value={extra.price}
                      disabled={disabled}
                      min={0}
                      max={10_000_000}
                      placeholder="Price"
                      className="w-28"
                      onChange={(next) => updateExtra(index, extraIndex, { price: Number(next ?? 0) })}
                    />
                    <Button
                      type="text"
                      danger
                      aria-label={`Remove add-on ${extraIndex + 1}`}
                      icon={<DeleteOutlined />}
                      disabled={disabled}
                      onClick={() =>
                        onChange(
                          packages.map((entry2, i) =>
                            i === index
                              ? { ...entry2, extras: entry2.extras.filter((_, j) => j !== extraIndex) }
                              : entry2,
                          ),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            )}

            <Button
              type="dashed"
              size="small"
              block
              className="mt-2"
              icon={<PlusOutlined />}
              disabled={disabled || entry.extras.length >= SERVICE_LIMITS.extrasMax}
              onClick={() =>
                onChange(
                  packages.map((entry2, i) =>
                    i === index
                      ? { ...entry2, extras: [...entry2.extras, { title: "", price: 0 }] }
                      : entry2,
                  ),
                )
              }
            >
              Add extra
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ServicePackageMatrix;
