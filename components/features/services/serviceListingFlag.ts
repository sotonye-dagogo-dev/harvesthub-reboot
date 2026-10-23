/**
 * SERVICE LISTING FEATURE FLAG — the single, clearly-marked import point.
 *
 * The real flag lives in `lib/config/features.ts` (`serviceListingEnabled`,
 * env `SERVICE_LISTING_ENABLED`, default `true`). Everything in this folder
 * imports the kill switch from here so the wiring stays in one place:
 *
 * - sidebar entry `/operations/services` (components/layout/Sidebar.tsx)
 * - storefront service view (app/products/[id]/page.tsx `serviceView`)
 * - the wizard page renders an explicit "disabled" notice when false
 *
 * With the flag off, existing service-flagged products stay readable through
 * the plain product view; only the new affordances are hidden.
 */
import { featureFlags } from '@/lib/config/features';

export const serviceListingEnabled: boolean = featureFlags.serviceListingEnabled;
