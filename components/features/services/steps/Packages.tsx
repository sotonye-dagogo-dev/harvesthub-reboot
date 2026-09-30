"use client";

import { Radio } from "antd";
import ServicePackageMatrix from "../ServicePackageMatrix";
import { packagesForTierCount } from "../wizardModel";
import { errorFor, Field, StepForm, StepSection, type StepComponentProps } from "./stepShared";

/**
 * Step 2 — packages.
 *
 * A service publishes either a single Basic tier or all three
 * (BASIC / STANDARD / PREMIUM, `SERVICE_TIER_KEYS`); switching the count keeps
 * whatever was already typed into the Basic column.
 */
export default function PackagesStep({ values, errors, onChange, disabled }: StepComponentProps) {
  const tierCount: 1 | 3 = values.packages.length >= 3 ? 3 : 1;
  const rootError = errorFor(errors, "packages");

  return (
    <StepForm>
      <StepSection
        title="Packages"
        description="Buyers choose a tier at checkout. The first package sets your listing price."
      />

      <div className="mb-4 rounded-ds-lg border border-ds-border-base bg-ds-surface-sunken p-4">
        <Field
          label="How many tiers do you offer?"
          error={rootError}
          help="A listing goes live with either one package or all three. You can change this later."
        >
          <Radio.Group
            value={tierCount}
            disabled={disabled}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: "1 tier (Basic)", value: 1 },
              { label: "3 tiers (Basic, Standard, Premium)", value: 3 },
            ]}
            onChange={(event) =>
              onChange({ packages: packagesForTierCount(values.packages, event.target.value as 1 | 3) })
            }
          />
        </Field>
      </div>

      <ServicePackageMatrix
        packages={values.packages}
        errors={errors}
        disabled={disabled}
        onChange={(packages) => onChange({ packages })}
      />
    </StepForm>
  );
}
