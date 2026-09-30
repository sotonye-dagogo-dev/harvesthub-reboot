"use client";

import ServiceRequirementsBuilder from "../ServiceRequirementsBuilder";
import { StepForm, StepSection, type StepComponentProps } from "./stepShared";

/**
 * Step 5 — requirements gateway.
 *
 * The buyer cannot start a service order until they answer these fields, so
 * this step defines the contract both the checkout notice and the order room
 * later read from (`serviceDetails.requirementFields`).
 */
export default function RequirementsStep({
  values,
  errors,
  onChange,
  disabled,
}: StepComponentProps) {
  return (
    <StepForm>
      <StepSection
        title="What do you need from the buyer?"
        description="Add only what you actually need — every required field blocks the start of the work."
      />

      <ServiceRequirementsBuilder
        fields={values.requirementFields}
        errors={errors}
        disabled={disabled}
        onChange={(requirementFields) => onChange({ requirementFields })}
      />
    </StepForm>
  );
}
