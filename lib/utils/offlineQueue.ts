export type OfflineQueueItem<TPayload = unknown> = {
    id: string;
    type: string;
    payload: TPayload;
    createdAt: string;
    attempts: number;
};

const OFFLINE_QUEUE_KEY = "myharvesthub.offline.queue.v1";

function readQueue<TPayload>(): OfflineQueueItem<TPayload>[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = window.localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as OfflineQueueItem<TPayload>[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeQueue<TPayload>(items: OfflineQueueItem<TPayload>[]): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
    } catch {
        // Ignore storage failures to avoid blocking runtime interactions.
    }
}

export function enqueueOfflineItem<TPayload>(
    type: string,
    payload: TPayload
): OfflineQueueItem<TPayload> {
    const item: OfflineQueueItem<TPayload> = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        payload,
        createdAt: new Date().toISOString(),
        attempts: 0,
    };

    const queue = readQueue<TPayload>();
    writeQueue([...queue, item]);
    return item;
}

export function getOfflineQueue<TPayload>(): OfflineQueueItem<TPayload>[] {
    return readQueue<TPayload>();
}

export async function replayOfflineQueue<TPayload>(
    handlerMap: Record<string, (payload: TPayload) => Promise<void>>,
    maxAttempts = 5
): Promise<{ processed: number; failed: number }> {
    const queue = readQueue<TPayload>();
    if (queue.length === 0) return { processed: 0, failed: 0 };

    const remaining: OfflineQueueItem<TPayload>[] = [];
    let processed = 0;
    let failed = 0;

    for (const item of queue) {
        const handler = handlerMap[item.type];
        if (!handler) {
            failed += 1;
            continue;
        }

        try {
            await handler(item.payload);
            processed += 1;
        } catch {
            const next = { ...item, attempts: item.attempts + 1 };
            if (next.attempts < maxAttempts) {
                remaining.push(next);
            }
            failed += 1;
        }
    }

    writeQueue(remaining);
    return { processed, failed };
}
