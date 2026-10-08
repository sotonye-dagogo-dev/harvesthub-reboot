/**
 * Order-room polling transport.
 *
 * Transport decision: no WebSocket/SSE — the stack is serverless and the repo
 * ships zero WS/SSE infrastructure, so the order room polls (visibility-gated)
 * behind this one seam so a WS/SSE transport can replace it later without
 * touching a single component.
 *
 * Contract for callers:
 *  - `start()` runs an immediate tick, then one tick every `intervalMs`.
 *  - Ticks are skipped while `document.visibilityState !== 'visible'` and the
 *    next `visibilitychange` to `visible` resumes immediately.
 *  - One tick at a time; the task receives an `AbortSignal` that fires when the
 *    poller is stopped or `refresh()` supersedes it.
 *  - `refresh()` runs a tick now (call it after a local mutation).
 */
import { ORDER_ROOM_POLL_MS } from '@/lib/config/serviceFulfillment';

export type OrderRoomTaskContext = {
    /** Aborted when the poller stops or a `refresh()` supersedes this tick. */
    signal: AbortSignal;
};

export type OrderRoomTask = (ctx: OrderRoomTaskContext) => void | Promise<void>;

export interface OrderRoomPollerOptions {
    /** Runs on every tick. Thrown errors go to `onError`, never crash the loop. */
    task: OrderRoomTask;
    /** Defaults to `ORDER_ROOM_POLL_MS` (10 000 ms). */
    intervalMs?: number;
    onError?: (error: unknown) => void;
    /** Test seam — defaults to the real document visibility state. */
    isVisible?: () => boolean;
}

export interface OrderRoomPoller {
    start(): void;
    stop(): void;
    /** Run one tick now; resolves when it settles. Safe to call mid-flight. */
    refresh(): Promise<void>;
    isRunning(): boolean;
}

function defaultIsVisible(): boolean {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
}

export function createOrderRoomPoller(options: OrderRoomPollerOptions): OrderRoomPoller {
    const intervalMs = options.intervalMs ?? ORDER_ROOM_POLL_MS;
    const isVisible = options.isVisible ?? defaultIsVisible;

    let started = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inflight: AbortController | null = null;
    let listening = false;

    function schedule(delay: number = intervalMs): void {
        if (!started) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            void runTick();
        }, delay);
    }

    async function runTick(): Promise<void> {
        if (!started) return;
        if (!isVisible()) {
            // Paused: keep the loop armed, do not burn a request while hidden.
            schedule();
            return;
        }
        if (inflight) return; // one tick at a time

        const controller = new AbortController();
        inflight = controller;
        try {
            await options.task({ signal: controller.signal });
        } catch (error) {
            if (!controller.signal.aborted) options.onError?.(error);
        } finally {
            if (inflight === controller) {
                inflight = null;
                schedule();
            }
        }
    }

    function handleVisibilityChange(): void {
        if (!started || !isVisible()) return;
        void runTick(); // resume immediately when the tab comes back
    }

    function start(): void {
        if (started) return;
        started = true;
        if (typeof document !== 'undefined' && !listening) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            listening = true;
        }
        void runTick();
    }

    function stop(): void {
        started = false;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (listening && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            listening = false;
        }
        if (inflight) {
            const controller = inflight;
            inflight = null;
            controller.abort();
        }
    }

    async function refresh(): Promise<void> {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (inflight) {
            const superseded = inflight;
            inflight = null;
            superseded.abort();
        }
        if (!started) {
            try {
                await options.task({ signal: new AbortController().signal });
            } catch (error) {
                options.onError?.(error);
            }
            return;
        }
        await runTick();
    }

    function isRunning(): boolean {
        return started;
    }

    return { start, stop, refresh, isRunning };
}
