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
