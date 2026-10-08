"use client";

import { Button, Input, Switch } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { OptionListSelect } from "@/components/ui";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import { requirementKeyFromLabel, type RequirementFieldDraft } from "./wizardModel";
import { errorFor, type StepFieldError } from "./steps/stepShared";

export interface ServiceRequirementsBuilderProps {
  fields: RequirementFieldDraft[];
  errors: StepFieldError[];
  onChange: (fields: RequirementFieldDraft[]) => void;
  disabled?: boolean;
}

/**
 * "What I need from you" builder.
 *
 * Field types come from the admin-editable `requirementFieldTypes` option list
 * (TEXT / SELECT / FILE in the fallback), keys are derived from the label as
 * UPPER_SNAKE_CASE to match `serviceRequirementFieldSchema`, and every row is
 * bounded by `SERVICE_LIMITS` before the schema ever runs.
 */
export function ServiceRequirementsBuilder({
  fields,
  errors,
  onChange,
  disabled,
}: ServiceRequirementsBuilderProps) {
  const updateAt = (index: number, patch: Partial<RequirementFieldDraft>) => {
    onChange(
      fields.map((field, i) => {
        if (i !== index) return field;
        const next = { ...field, ...patch };
        if (patch.label !== undefined) {
          const taken = fields.filter((_, j) => j !== index).map((entry) => entry.key);
          next.key = requirementKeyFromLabel(patch.label, taken);
        }
        return next;
      }),
    );
  };

  const addField = () => {
    if (fields.length >= SERVICE_LIMITS.maxRequirementFields) return;
    const taken = fields.map((field) => field.key);
    onChange([...fields, { key: requirementKeyFromLabel("", taken), label: "", type: "TEXT", options: [], required: true }]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const rootError = errorFor(errors, "requirementFields");

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ds-text-secondary">
          {fields.length}/{SERVICE_LIMITS.maxRequirementFields} fields. Buyers must answer the
          required ones before work starts.
        </p>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          disabled={disabled || fields.length >= SERVICE_LIMITS.maxRequirementFields}
          onClick={addField}
        >
          Add field
        </Button>
      </div>

      {rootError ? <p className="mb-3 text-xs text-ds-status-error-text">{rootError}</p> : null}

      {fields.length === 0 ? (
        <div className="rounded-ds-lg border border-ds-border-base bg-ds-surface-sunken p-6 text-center">
          <p className="text-sm font-medium text-ds-text-primary">No requirements yet</p>
          <p className="mt-1 text-xs text-ds-text-secondary">
            Add the details you need from a buyer — a brand name, reference files, measurements or
            a colour preference.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const labelError = errorFor(errors, `requirementFields.${index}.label`);
            const typeError = errorFor(errors, `requirementFields.${index}.type`);
            const optionsError = errorFor(errors, `requirementFields.${index}.options`);
            const keyError = errorFor(errors, `requirementFields.${index}.key`);

            return (
              <li
                key={field.key || `field-${index}`}
                className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4 shadow-ds-xs"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ds-text-tertiary">
                    {field.key || `Field ${index + 1}`}
                  </span>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    aria-label={`Remove requirement ${index + 1}`}
                    disabled={disabled}
                    onClick={() => removeField(index)}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-ds-text-secondary">
                      What do you need?
                    </span>
                    <Input
                      value={field.label}
                      disabled={disabled}
                      maxLength={SERVICE_LIMITS.requirementLabelMax}
                      placeholder="Brand name"
                      status={labelError || keyError ? "error" : undefined}
                      onChange={(event) => updateAt(index, { label: event.target.value })}
                    />
                    {labelError || keyError ? (
                      <span className="block text-xs text-ds-status-error-text">
                        {labelError ?? keyError}
                      </span>
                    ) : null}
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-medium text-ds-text-secondary">Answer type</span>
                    <OptionListSelect
                      listKey="requirementFieldTypes"
                      value={field.type}
                      disabled={disabled}
                      status={typeError ? "error" : undefined}
                      onChange={(next) =>
                        updateAt(index, { type: next as RequirementFieldDraft["type"] })
                      }
                    />
                    {typeError ? (
                      <span className="block text-xs text-ds-status-error-text">{typeError}</span>
                    ) : null}
                  </label>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Switch
                    size="small"
                    checked={field.required}
                    disabled={disabled}
                    aria-label={`Required for field ${index + 1}`}
                    onChange={(checked) => updateAt(index, { required: checked })}
                  />
                  <span className="text-xs text-ds-text-secondary">
                    {field.required ? "Required before work starts" : "Optional"}
                  </span>
                </div>

                {field.type === "SELECT" ? (
                  <div className="mt-3 rounded-ds-md border border-ds-border-base bg-ds-surface-sunken p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ds-text-primary">
                        Choice options
                      </span>
                      <span className="text-[11px] text-ds-text-tertiary">
                        {field.options.length}/{SERVICE_LIMITS.requirementOptionMax}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {field.options.map((option, optionIndex) => (
                        <li key={`option-${optionIndex}`} className="flex items-center gap-2">
                          <Input
                            value={option}
                            disabled={disabled}
                            maxLength={SERVICE_LIMITS.requirementLabelMax}
                            placeholder={`Option ${optionIndex + 1}`}
                            onChange={(event) =>
                              updateAt(index, {
                                options: field.options.map((entry, j) =>
                                  j === optionIndex ? event.target.value : entry,
                                ),
                              })
                            }
                          />
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={`Remove option ${optionIndex + 1}`}
                            disabled={disabled}
                            onClick={() =>
                              updateAt(index, {
                                options: field.options.filter((_, j) => j !== optionIndex),
                              })
                            }
                          />
                        </li>
                      ))}
                    </ul>

                    <Button
                      type="dashed"
                      size="small"
                      block
                      className="mt-2"
                      icon={<PlusOutlined />}
                      disabled={disabled || field.options.length >= SERVICE_LIMITS.requirementOptionMax}
                      onClick={() => updateAt(index, { options: [...field.options, ""] })}
                    >
                      Add option
                    </Button>

                    {optionsError ? (
                      <p className="mt-2 text-xs text-ds-status-error-text">{optionsError}</p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ServiceRequirementsBuilder;
