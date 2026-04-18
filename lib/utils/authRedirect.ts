const PENDING_AUTH_REDIRECT_KEY = "myharvesthub.pending-auth-redirect.v1";
const PENDING_AUTH_REDIRECT_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

type PendingRedirectPayload = {
  path: string;
  createdAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function sanitizeInternalRedirectPath(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "https://myharvesthub.local");
    if (parsed.origin !== "https://myharvesthub.local") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function setPendingAuthRedirect(path: string): void {
  if (!canUseStorage()) return;

  const safePath = sanitizeInternalRedirectPath(path, "");
  if (!safePath) return;

  const payload: PendingRedirectPayload = {
    path: safePath,
    createdAt: Date.now(),
  };

  try {
    window.localStorage.setItem(PENDING_AUTH_REDIRECT_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

export function clearPendingAuthRedirect(): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(PENDING_AUTH_REDIRECT_KEY);
  } catch {
    // ignore storage failures
  }
}

export function getPendingAuthRedirect(): string | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(PENDING_AUTH_REDIRECT_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as PendingRedirectPayload;
    if (!payload || typeof payload.path !== "string" || typeof payload.createdAt !== "number") {
      clearPendingAuthRedirect();
      return null;
    }

    if (Date.now() - payload.createdAt > PENDING_AUTH_REDIRECT_TTL_MS) {
      clearPendingAuthRedirect();
      return null;
    }

    const safePath = sanitizeInternalRedirectPath(payload.path, "");
    if (!safePath) {
      clearPendingAuthRedirect();
      return null;
    }

    return safePath;
  } catch {
    clearPendingAuthRedirect();
    return null;
  }
}

export function consumePendingAuthRedirect(): string | null {
  const pending = getPendingAuthRedirect();
  clearPendingAuthRedirect();
  return pending;
}
