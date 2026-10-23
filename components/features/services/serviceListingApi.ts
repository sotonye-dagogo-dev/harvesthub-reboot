/**
 * HTTP layer for the service listing wizard.
 *
 * Kept separate from `wizardModel` (pure payloads) so the step components stay
 * presentational and the endpoint contract can be tested without React:
 *
 *  - every validated step  → `saveServiceDraft`     (server-side draft, isActive=false)
 *  - Publish button        → `publishServiceListing` (isActive=true, server derives
 *                            price + SERVICE_UNLIMITED_STOCK and runs
 *                            assertPublishableServiceDetails)
 */

import type { Product } from '@/lib/types';
import {
  buildCreateDraftPayload,
  buildDraftPayload,
  buildPublishPayload,
  type ServiceProductPayload,
  type ServiceWizardValues,
} from './wizardModel';

export interface ServiceDraftSaveInput {
  productId: string | null;
  values: ServiceWizardValues;
  /** Step index the vendor has reached — persisted as `serviceDetails.draftStep`. */
  draftStep: number;
  /** True when the listing is already live (keeps it live while edited). */
  wasActive: boolean;
  vendorId?: string;
}

export interface ServiceDraftSaveResult {
  product: Product;
  /** A new row was created on the server during this save. */
  created: boolean;
  /** The row is confirmed offline (`isActive === false`). */
  offline: boolean;
}

export interface ServicePublishInput {
  productId: string | null;
  values: ServiceWizardValues;
  vendorId?: string;
}

/** Server error enriched with the shared API envelope fields. */
export class ServiceListingApiError extends Error {
  readonly code?: string;
  readonly issues: string[];

  constructor(message: string, options: { code?: string; issues?: string[] } = {}) {
    super(message);
    this.name = 'ServiceListingApiError';
    this.code = options.code;
    this.issues = options.issues ?? [];
  }
}

function normalizeIssues(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) =>
      typeof entry === 'string' ? entry : typeof entry?.message === 'string' ? entry.message : '',
    )
    .filter(Boolean);
}

async function requestProduct(url: string, init: RequestInit): Promise<Product> {
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    product?: Product;
    error?: string;
    code?: string;
    issues?: unknown;
  };

  if (!response.ok || !payload.product) {
    throw new ServiceListingApiError(payload.error || 'Unable to save this listing', {
      code: payload.code,
      issues: normalizeIssues(payload.issues),
    });
  }
  return payload.product;
}

function post(url: string, body: ServiceProductPayload): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function put(url: string, body: unknown): RequestInit {
  return {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/**
 * Advances the server-side draft after a step validates.
 *
 * New listings are created with `POST /api/products` (the route ignores
 * `isActive` today) and immediately pinned offline with a `PUT`, so an
 * unpublished listing never sits in the public feed between requests. Existing
 * rows are updated in one call; an already-published listing keeps its
 * `isActive=true` because the server re-runs the publish gate on those saves.
 */
export async function saveServiceDraft(
  input: ServiceDraftSaveInput,
): Promise<ServiceDraftSaveResult> {
  const { productId, values, draftStep, wasActive, vendorId } = input;

  if (!productId) {
    const created = await requestProduct(
      '/api/products',
      post('/api/products', buildCreateDraftPayload(values, { draftStep, vendorId })),
    );

    try {
      const pinned = await requestProduct(
        `/api/products/${created.id}`,
        put(`/api/products/${created.id}`, { isActive: false }),
      );
      return { product: pinned, created: true, offline: pinned.isActive === false };
    } catch {
      // The row exists but could not be pinned offline — hand it back so the
      // wizard keeps its id and the next save retries as an update.
      return { product: created, created: true, offline: false };
    }
  }

  const updated = await requestProduct(
    `/api/products/${productId}`,
    put(`/api/products/${productId}`, buildDraftPayload(values, { draftStep, wasActive, vendorId })),
  );
  return { product: updated, created: false, offline: updated.isActive === false };
}

/**
 * Publishes the listing. The server derives the base package price and
 * `SERVICE_UNLIMITED_STOCK` and rejects anything `assertPublishableServiceDetails`
 * would refuse — the wizard runs that gate first so the failure can be routed
 * back to the offending step.
 */
export async function publishServiceListing(input: ServicePublishInput): Promise<Product> {
  const { productId, values, vendorId } = input;
  const payload = buildPublishPayload(values, { vendorId, creating: !productId });

  if (productId) {
    return requestProduct(`/api/products/${productId}`, put(`/api/products/${productId}`, payload));
  }
  return requestProduct('/api/products', post('/api/products', payload));
}
