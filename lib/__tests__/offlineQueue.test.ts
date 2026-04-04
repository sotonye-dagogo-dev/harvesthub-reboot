import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueueOfflineItem,
  getOfflineQueue,
  replayOfflineQueue,
} from "@/lib/utils/offlineQueue";

describe("offlineQueue utilities", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (storageKey: string) => storage.get(storageKey) ?? null,
        setItem: (storageKey: string, value: string) => {
          storage.set(storageKey, value);
        },
        removeItem: (storageKey: string) => {
          storage.delete(storageKey);
        },
        clear: () => {
          storage.clear();
        },
      },
    });
  });

  it("enqueues items and exposes queue state", () => {
    const item = enqueueOfflineItem("ad-application.submit", { id: "job-1" });
    const queue = getOfflineQueue<{ id: string }>();
    const firstItem = queue[0];

    expect(queue).toHaveLength(1);
    expect(firstItem).toBeDefined();
    expect(firstItem!.id).toBe(item.id);
    expect(firstItem!.type).toBe("ad-application.submit");
    expect(firstItem!.attempts).toBe(0);
    expect(firstItem!.payload).toEqual({ id: "job-1" });
  });

  it("replays handled items and removes successful entries", async () => {
    enqueueOfflineItem("ad-application.submit", { id: "job-1" });
    const handler = vi.fn(async () => undefined);

    const result = await replayOfflineQueue({
      "ad-application.submit": handler,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ id: "job-1" });
    expect(result).toEqual({ processed: 1, failed: 0 });
    expect(getOfflineQueue()).toHaveLength(0);
  });

  it("keeps failed entries until max attempts is reached", async () => {
    enqueueOfflineItem("ad-application.submit", { id: "job-1" });
    const handler = vi.fn(async () => {
      throw new Error("network down");
    });

    const firstReplay = await replayOfflineQueue(
      {
        "ad-application.submit": handler,
      },
      3
    );

    expect(firstReplay).toEqual({ processed: 0, failed: 1 });
    expect(getOfflineQueue()).toHaveLength(1);
    const queuedAfterFailure = getOfflineQueue()[0];
    expect(queuedAfterFailure).toBeDefined();
    expect(queuedAfterFailure!.attempts).toBe(1);

    await replayOfflineQueue(
      {
        "ad-application.submit": handler,
      },
      3
    );

    const thirdReplay = await replayOfflineQueue(
      {
        "ad-application.submit": handler,
      },
      3
    );

    expect(thirdReplay).toEqual({ processed: 0, failed: 1 });
    expect(getOfflineQueue()).toHaveLength(0);
  });

  it("counts unknown handlers as failed and drops those entries", async () => {
    enqueueOfflineItem("unknown.type", { id: "job-1" });

    const result = await replayOfflineQueue({});

    expect(result).toEqual({ processed: 0, failed: 1 });
    expect(getOfflineQueue()).toHaveLength(0);
  });
});
