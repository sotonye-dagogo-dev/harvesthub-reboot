"use client";

import { Input } from "antd";
import { MapPin } from "lucide-react";
import { OptionListSelect } from "@/components/ui";
import { SERVICE_GEO_MAP_ENABLED } from "@/lib/config/serviceFulfillment";
import { BookingCalendar } from "@/components/features/BookingCalendar";
import ServiceAvailabilityGrid from "../ServiceAvailabilityGrid";
import { errorFor, Field, StepForm, StepSection, type StepComponentProps } from "./stepShared";

const { TextArea } = Input;

/**
 * Step 3 — location & availability.
 *
 * Only mounted for `ON_SITE` services: digital listings carry no geo payload
 * at all (the server rejects one — PRD TC-001), so there is nothing to fill in.
 * The map preview stays behind `SERVICE_GEO_MAP_ENABLED` because the stack has
 * no Maps key; the address, campus and radius are stored regardless.
 */
export default function LocationStep({ values, errors, onChange, disabled }: StepComponentProps) {
  const addressError = errorFor(errors, "geo.address") ?? errorFor(errors, "geo");

  return (
    <StepForm>
      <StepSection
        title="Location & availability"
        description="On-site services need an address so buyers know where the work happens."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field
          label="Service address"
          required
          error={addressError}
          help="Street, area or campus where you render this service."
          className="md:col-span-2"
        >
          <TextArea
            value={values.geo.address}
            disabled={disabled}
            rows={2}
            maxLength={200}
            showCount
            placeholder="12 Knowledge Avenue, West Campus"
            status={addressError ? "error" : undefined}
            onChange={(event) => onChange({ geo: { ...values.geo, address: event.target.value } })}
          />
        </Field>

        <Field label="Landmark (optional)" help="A well-known spot buyers can navigate to.">
          <Input
            value={values.geo.landmark ?? ""}
            disabled={disabled}
            maxLength={120}
            placeholder="Opposite the main gate"
            onChange={(event) => onChange({ geo: { ...values.geo, landmark: event.target.value } })}
          />
        </Field>

        <Field label="Campus / zone" help="Used for discovery filters.">
          <OptionListSelect
            listKey="campus"
            value={values.geo.campus}
            disabled={disabled}
            allowClear
            placeholder="Select a campus"
            onChange={(next) => {
              const nextGeo = { ...values.geo };
              if (next) nextGeo.campus = String(next);
              else delete nextGeo.campus;
              onChange({ geo: nextGeo });
            }}
          />
        </Field>
      </div>

      {SERVICE_GEO_MAP_ENABLED ? (
        <div className="mt-4 rounded-ds-lg border border-ds-border-base bg-ds-surface-sunken p-4">
          <div className="mb-2 flex items-center gap-2 text-ds-text-primary">
            <MapPin className="h-4 w-4" aria-hidden />
            <span className="text-sm font-semibold">Map preview</span>
          </div>
          <p className="text-xs text-ds-text-secondary">
            {values.geo.address
              ? values.geo.address
              : "Add an address to preview the service area."}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="mb-1 text-base font-semibold text-ds-text-primary">Weekly availability</h3>
        <p className="mb-3 text-xs text-ds-text-secondary">
          Set the recurring hours buyers can book you for. Leave a day off the list to keep it
          closed.
        </p>
        <ServiceAvailabilityGrid
          slots={values.availableSlots}
          errors={errors}
          disabled={disabled}
          onChange={(availableSlots) => onChange({ availableSlots })}
        />
      </div>

      {values.availableSlots.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-1 text-base font-semibold text-ds-text-primary">
            Buyer-facing preview
          </h3>
          <p className="mb-3 text-xs text-ds-text-secondary">
            This is the calendar buyers will see when they book an on-site slot.
          </p>
          <BookingCalendar availableSlots={values.availableSlots} />
        </div>
      ) : null}
    </StepForm>
  );
}
