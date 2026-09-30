/**
 * SERVICE LISTING FEATURE FLAG — the single, clearly-marked import point.
 *
 * The plan puts `serviceListingEnabled` in `lib/config/features.ts`, but that
 * file is lead-owned (`lib/config/*` is outside this task's partition) and does
 * not export the flag yet. Everything in this task imports the kill switch from
 * here, so wiring the real flag later is a one-line change in this file:
 *
 *   import { featureFlags } from '@/lib/config/features';
 *   export const serviceListingEnabled = featureFlags.serviceListingEnabled;
 *
 * Default is `true` (the feature ships on); flipping this to `false` hides the
 * wizard page behind an explicit "disabled" notice.
 */
export const serviceListingEnabled = true;
