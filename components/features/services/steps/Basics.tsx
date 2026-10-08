"use client";

import { Input, Segmented } from "antd";
import ImageUpload from "@/components/ui/ImageUpload";
import { OptionListSelect } from "@/components/ui";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import { errorFor, Field, StepForm, StepSection, type StepComponentProps } from "./stepShared";

const { TextArea } = Input;

/**
 * Step 1 — listing identity.
 *
 * `deliveryMode` is decided here: choosing "On-site" adds the Location step,
 * choosing "Digital" removes it (and `buildServiceDetails` then drops any geo
 * payload — the PRD TC-001 rule the server enforces too).
 */
export default function BasicsStep({
  values,
  errors,
  onChange,
  vendorId,
  disabled,
}: StepComponentProps) {
  return (
    <StepForm>
      <StepSection
        title="Listing basics"
        description="How buyers find and read your service. The title is capped at 80 characters."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Service title"
          required
          error={errorFor(errors, "name")}
          help='Lead with the outcome, e.g. "I will design a professional logo for your brand".'
          className="md:col-span-2"
        >
          <Input
            value={values.name}
            disabled={disabled}
            maxLength={SERVICE_LIMITS.titleMax}
            showCount
            placeholder="I will design a professional logo for your brand"
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </Field>

        <Field
          label="Delivery type"
          required
          error={errorFor(errors, "deliveryMode")}
          help="On-site services collect an address and availability. Digital services carry no location."
        >
          <Segmented
            block
            disabled={disabled}
            value={values.deliveryMode}
            options={[
              { label: "Digital", value: "DIGITAL" },
              { label: "On-site", value: "ON_SITE" },
            ]}
            onChange={(next) => onChange({ deliveryMode: next as "DIGITAL" | "ON_SITE" })}
          />
        </Field>

        <Field label="Service category" required error={errorFor(errors, "serviceCategory")}>
          <OptionListSelect
            listKey="serviceCategories"
            value={values.serviceCategory || undefined}
            disabled={disabled}
            showDescription
            placeholder="Select a service category"
            onChange={(next) => onChange({ serviceCategory: String(next ?? "") })}
          />
        </Field>

        <Field label="Pricing type" required error={errorFor(errors, "rateType")}>
          <OptionListSelect
            listKey="serviceRateTypes"
            value={values.rateType || undefined}
            disabled={disabled}
            showDescription
            placeholder="Fixed price, per hour, custom quote…"
            onChange={(next) => onChange({ rateType: String(next ?? "") })}
          />
        </Field>

        <Field
          label="Short description"
          error={errorFor(errors, "shortDescription")}
          help="One line shown on cards and in search results."
        >
          <TextArea
            value={values.shortDescription}
            disabled={disabled}
            rows={2}
            maxLength={160}
            showCount
            placeholder="Three logo concepts delivered in 3 days"
            onChange={(event) => onChange({ shortDescription: event.target.value })}
          />
        </Field>

        <Field
          label="Description"
          required
          error={errorFor(errors, "description")}
          help={`Plain text, up to ${SERVICE_LIMITS.descriptionMax} characters. No raw HTML.`}
          className="md:col-span-2"
        >
          <TextArea
            value={values.description}
            disabled={disabled}
            rows={6}
            maxLength={SERVICE_LIMITS.descriptionMax}
            showCount
            placeholder={"What you deliver, how you work, and what the buyer gets.\n\nExample:\n- 3 concepts, 2 revisions\n- Source files included"}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </Field>

        <Field
          label="Cover image"
          required
          error={errorFor(errors, "mainImage")}
          help="Shown as the listing cover. JPG, PNG or WebP up to 5MB."
          className="md:col-span-2"
        >
          <div className="space-y-2">
            <ImageUpload
              folderType="product"
              vendorId={vendorId}
              disabled={disabled}
              helpText="Upload a clear cover image for this service."
              valueUrl={values.mainImage}
              onUploaded={(result) => onChange({ mainImage: result.url })}
            />
          </div>
        </Field>
      </div>
    </StepForm>
  );
}
