"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Button, Spin, Tag, message } from "antd";
import { AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { StageTracker } from "@/components/ui";
import type { Product } from "@/lib/types";
import { assertPublishableServiceDetails } from "@/lib/schemas/service.schemas";
import {
  STEP_LOCATION,
  activeStepIndices,
  clampDraftStep,
  buildServiceDetails,
  clearServiceListingLocalDraft,
  createDefaultWizardValues,
  restoreWizardState,
  saveServiceListingLocalDraft,
  serviceListingDraftScope,
  stepFieldErrors,
  stepForPublishIssue,
  stepLabelsFor,
  validateAllSteps,
  validateStep,
  valuesFromProduct,
  type ServiceWizardValues,
} from "./wizardModel";
import {
  ServiceListingApiError,
  publishServiceListing,
  saveServiceDraft,
} from "./serviceListingApi";
import type { StepComponentProps, StepFieldError } from "./steps/stepShared";
import BasicsStep from "./steps/Basics";
import PackagesStep from "./steps/Packages";
import LocationStep from "./steps/Location";
import MediaStep from "./steps/Media";
import RequirementsStep from "./steps/Requirements";

const STEP_COMPONENTS: Record<number, (props: StepComponentProps) => ReactElement> = {
  0: BasicsStep,
  1: PackagesStep,
  2: LocationStep,
  3: MediaStep,
  4: RequirementsStep,
};

export interface ServiceListingWizardProps {
  /** Existing row being edited (draft or already-published listing). */
  product?: Product | null;
  /** Upload target; vendors pass their own id, admins pick one. */
  vendorId?: string;
  /** Stable per-user scope for the instant-recovery local draft. */
  userScope: string;
  /** Fired after every successful server-side draft save. */
  onSaved?: (product: Product) => void;
  /** Fired after a successful publish. */
  onPublished?: (product: Product) => void;
  /** Optional "back to listings" handler rendered in the header. */
  onExit?: () => void;
}

/**
 * 5-step service listing wizard (full page, not a modal).
 *
 * Data flow:
 *  - every keystroke → namespaced local draft (`lib/utils/localDraft.ts`)
 *  - every validated step → server-side draft Product
 *    (`POST/PUT /api/products`, `isActive=false`, `serviceDetails.draftStep=n`)
 *  - Publish → `isActive=true`; the server derives the base package price and
 *    `SERVICE_UNLIMITED_STOCK` and re-runs `assertPublishableServiceDetails`.
 *
 * Validation is never duplicated here: it always goes through
 * `validateServiceStep(step, values)` from `lib/schemas/service.schemas.ts`,
 * with the step indices `SERVICE_STEP_SCHEMAS` uses.
 */
export function ServiceListingWizard({
  product,
  vendorId,
  userScope,
  onSaved,
  onPublished,
  onExit,
}: ServiceListingWizardProps) {
  const scope = useMemo(
    () => serviceListingDraftScope(userScope, product?.id ?? null),
    [userScope, product],
  );
  const wasActive = product?.isActive ?? false;

  const [values, setValues] = useState<ServiceWizardValues>(() =>
    product ? valuesFromProduct(product) : createDefaultWizardValues(),
  );
  const [step, setStep] = useState<number>(() =>
    clampDraftStep(
      product ? (product.serviceDetails?.deliveryMode ?? "DIGITAL") : "DIGITAL",
      product?.serviceDetails?.draftStep ?? 0,
    ),
  );
  const [productId, setProductId] = useState<string | null>(product?.id ?? null);
  const [fieldErrors, setFieldErrors] = useState<StepFieldError[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const restoreKeyRef = useRef<string | null>(null);
  const restoredRef = useRef(false);

  // ── Recovery: local instant draft wins over the server draft ───────────────
  useEffect(() => {
    const key = `${scope}:${product?.id ?? "none"}`;
    if (restoreKeyRef.current === key) return;
    restoreKeyRef.current = key;

    const restored = restoreWizardState({ scope, product: product ?? null });
    setValues(restored.values);
    setStep(restored.step);
    setProductId(product?.id ?? null);
    restoredRef.current = true;
  }, [product, scope]);

  // ── Instant recovery: mirror state into localStorage on every change ───────
  useEffect(() => {
    if (!restoredRef.current) return;
    saveServiceListingLocalDraft(scope, { productId, step, values });
  }, [productId, scope, step, values]);

  // Dropping Location by switching to Digital must never strand the wizard on
  // a step that no longer exists for this delivery mode.
  useEffect(() => {
    const steps = activeStepIndices(values.deliveryMode);
    if (!steps.includes(step)) {
      setStep(clampDraftStep(values.deliveryMode, step));
    }
  }, [step, values.deliveryMode]);

  const steps = activeStepIndices(values.deliveryMode);
  const position = Math.max(0, steps.indexOf(step));
  const isLast = position === steps.length - 1;
  const StepComponent = STEP_COMPONENTS[step];
  const busy = saving || publishing;

  const handleBack = useCallback(() => {
    const target = steps[position - 1];
    if (target === undefined) return;
    setNotice(null);
    setFieldErrors([]);
    setStep(target);
  }, [position, steps]);

  const updateValues = useCallback((patch: Partial<ServiceWizardValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setNotice(null);
    setFieldErrors([]);
  }, []);

  const failStep = useCallback((target: number, issue: string) => {
    setStep(target);
    setNotice(issue);
    setFieldErrors(stepFieldErrors(target, values));
  }, [values]);

  const handleNext = useCallback(async () => {
    const issue = validateStep(step, values);
    if (issue) {
      setNotice(issue);
      setFieldErrors(stepFieldErrors(step, values));
      return;
    }

    const target = steps[position + 1];
    if (target === undefined) return;

    setNotice(null);
    setFieldErrors([]);
    setSaving(true);
    try {
      const result = await saveServiceDraft({ productId, values, draftStep: target, wasActive, vendorId });
      setProductId(result.product.id);
      if (result.offline || wasActive) {
        setSavedAt(Date.now());
        onSaved?.(result.product);
      } else {
        message.warning("Saved on this device only — the server draft could not be updated.");
      }
    } catch (error) {
      message.warning(
        error instanceof Error
          ? `${error.message} — kept on this device`
          : "Could not sync the server draft — kept on this device",
      );
    } finally {
      setSaving(false);
      setStep(target);
    }
  }, [onSaved, position, productId, steps, values, vendorId, wasActive]);

  const handlePublish = useCallback(async () => {
    const invalid = validateAllSteps(values);
    if (invalid) {
      failStep(invalid.step, invalid.message);
      return;
    }

    const gateIssues = assertPublishableServiceDetails(buildServiceDetails(values));
    if (gateIssues.length > 0) {
      const first = gateIssues[0] as string;
      failStep(stepForPublishIssue(first), first);
      return;
    }

    setNotice(null);
    setFieldErrors([]);
    setPublishing(true);
    try {
      const published = await publishServiceListing({ productId, values, vendorId });
      clearServiceListingLocalDraft(scope);
      setProductId(published.id);
      message.success("Service listing published");
      onPublished?.(published);
    } catch (error) {
      if (error instanceof ServiceListingApiError) {
        const first = error.issues[0] ?? error.message;
        failStep(stepForPublishIssue(first), first);
      } else {
        setNotice(error instanceof Error ? error.message : "Unable to publish this listing");
      }
    } finally {
      setPublishing(false);
    }
  }, [failStep, onPublished, productId, scope, values, vendorId]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-ds-text-primary">
              {wasActive ? "Edit service listing" : "New service listing"}
            </h1>
            <Tag color={wasActive ? "green" : "orange"} className="m-0">
              {wasActive ? "Published" : "Draft"}
            </Tag>
          </div>
          <p className="mt-1 text-sm text-ds-text-secondary">
            Five steps: basics, packages, location (on-site only), media and what you need from the
            buyer. Each step saves a draft as you go.
          </p>
          {savedAt ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-ds-status-success-text">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Draft saved {new Date(savedAt).toLocaleTimeString("en-NG")}
            </p>
          ) : null}
        </div>

        {onExit ? (
          <Button onClick={onExit} disabled={busy}>
            Back to listings
          </Button>
        ) : null}
      </div>

      <StageTracker
        currentStage={position}
        labels={stepLabelsFor(values.deliveryMode)}
        onBack={handleBack}
        canGoBack={position > 0}
      />

      {notice ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-ds-lg border border-ds-border-brand bg-ds-brand-surface p-4"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ds-text-brand" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ds-text-primary">Check this step</p>
            <p className="text-sm text-ds-text-secondary">{notice}</p>
          </div>
        </div>
      ) : null}

      <div className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4 shadow-ds-sm sm:p-6">
        {step === STEP_LOCATION && values.deliveryMode !== "ON_SITE" ? null : StepComponent ? (
          <StepComponent
            values={values}
            errors={fieldErrors}
            onChange={updateValues}
            vendorId={vendorId}
            disabled={busy}
          />
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {position > 0 ? (
            <Button icon={<ArrowLeft className="h-4 w-4" />} disabled={busy} onClick={handleBack}>
              Back
            </Button>
          ) : null}
          {saving ? (
            <span className="flex items-center gap-2 text-xs text-ds-text-tertiary">
              <Spin size="small" /> Saving draft…
            </span>
          ) : null}
        </div>

        {isLast ? (
          <Button
            type="primary"
            loading={publishing}
            disabled={saving}
            icon={<Check className="h-4 w-4" />}
            onClick={() => void handlePublish()}
          >
            Publish listing
          </Button>
        ) : (
          <Button
            type="primary"
            loading={saving}
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={() => void handleNext()}
          >
            Save &amp; continue
          </Button>
        )}
      </div>
    </div>
  );
}

export default ServiceListingWizard;
