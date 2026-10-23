import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOrderRoomPoller } from "@/lib/services/orderRoomTransport";

describe("createOrderRoomPoller", () => {
  const visible = { value: true };

  beforeEach(() => {
    vi.useFakeTimers();
    visible.value = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls on the configured interval and skips ticks while hidden", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const poller = createOrderRoomPoller({
      task,
      intervalMs: 10_000,
      isVisible: () => visible.value,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(task).toHaveBeenCalledTimes(2);

    // Tab hidden → no request is spent, but the loop stays armed.
    visible.value = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(task).toHaveBeenCalledTimes(2);

    // Back to visible → resumes immediately on visibilitychange.
    visible.value = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledTimes(3);

    poller.stop();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(task).toHaveBeenCalledTimes(3);
    expect(poller.isRunning()).toBe(false);
  });

  it("refresh() runs a tick immediately without waiting for the interval", async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const poller = createOrderRoomPoller({ task, intervalMs: 10_000, isVisible: () => true });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(task).toHaveBeenCalledTimes(1);

    await poller.refresh();
    expect(task).toHaveBeenCalledTimes(2);

    poller.stop();
  });

  it("routes task failures to onError and keeps polling", async () => {
    const onError = vi.fn();
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValue(undefined);
    const poller = createOrderRoomPoller({
      task,
      intervalMs: 10_000,
      isVisible: () => true,
      onError,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(task).toHaveBeenCalledTimes(2);

    poller.stop();
  });

  it("aborts the in-flight tick when stopped", async () => {
    const holder: { signal: AbortSignal | null } = { signal: null };
    const task = vi.fn((ctx: { signal: AbortSignal }) => {
      holder.signal = ctx.signal;
      return new Promise<void>(() => undefined);
    });
    const poller = createOrderRoomPoller({ task, intervalMs: 10_000, isVisible: () => true });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(holder.signal).not.toBeNull();

    poller.stop();
    expect(holder.signal?.aborted).toBe(true);
  });
});
