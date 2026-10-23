export function loadLocalDraft<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

export function saveLocalDraft<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage errors so form interactions are never blocked.
    }
}

export function clearLocalDraft(key: string): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.removeItem(key);
    } catch {
        // Ignore storage errors.
    }
}

// ─── Namespaced, versioned keys ─────────────────────────────────────────────

/**
 * Instant-recovery draft key for the service listing wizard.
 *
 * Namespaced per feature and versioned (`v1`) so a future shape change can
 * ship without trying to parse payloads written by an older bundle — a
 * mismatched version is discarded instead of restored.
 */
export const SERVICE_LISTING_DRAFT_NAMESPACE = "myharvesthub.services.listing-wizard";
export const SERVICE_LISTING_DRAFT_VERSION = 1;

/** Scoped key: one instant-recovery draft per vendor (or guest) and listing. */
export function serviceListingDraftKey(scope: string): string {
    const safeScope = scope.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 64) || "global";
    return `${SERVICE_LISTING_DRAFT_NAMESPACE}.v${SERVICE_LISTING_DRAFT_VERSION}.${safeScope}`;
}

interface VersionedDraftEnvelope<T> {
    version: number;
    savedAt: number;
    payload: T;
}

/** Writes a versioned draft envelope under `key`. Never throws. */
export function saveVersionedLocalDraft<T>(key: string, payload: T, version: number): void {
    if (typeof window === "undefined") return;

    const envelope: VersionedDraftEnvelope<T> = { version, savedAt: Date.now(), payload };
    try {
        window.localStorage.setItem(key, JSON.stringify(envelope));
    } catch {
        // Ignore storage errors so form interactions are never blocked.
    }
}

/**
 * Reads a versioned draft envelope. Returns `null` for missing, malformed or
 * version-mismatched payloads (and clears the stale entry when possible).
 */
export function loadVersionedLocalDraft<T>(key: string, version: number): T | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<VersionedDraftEnvelope<T>>;
        if (!parsed || typeof parsed !== "object" || parsed.version !== version) {
            clearLocalDraft(key);
            return null;
        }
        return (parsed.payload as T) ?? null;
    } catch {
        return null;
    }
}

