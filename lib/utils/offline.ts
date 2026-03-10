/**
 * Offline Utilities
 *
 * Helpers for handling offline state and guarding actions
 * that require network connectivity.
 */

/**
 * Wraps an async action so it throws a user-friendly error when offline.
 */
export function withOnlineCheck<T>(
  action: () => Promise<T>,
  fallbackMessage?: string
): () => Promise<T> {
  return async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error(
        fallbackMessage || "You're offline. Please try this when you're connected."
      );
    }
    return action();
  };
}

/**
 * Returns whether the browser currently has a network connection.
 * Defaults to `true` on the server.
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
