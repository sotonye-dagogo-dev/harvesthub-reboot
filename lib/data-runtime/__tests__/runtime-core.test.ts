import { describe, expect, it, beforeEach } from "vitest";
import { areResourcesEqual, reconcileResourceData } from "@/lib/data-runtime/reconciler";
import { loadRuntimeResource } from "@/lib/data-runtime/runtimeClient";
import { registerRuntimeResource } from "@/lib/data-runtime/resourceRegistry";
import { useRuntimeStore, getRuntimeResourceState } from "@/lib/data-runtime/runtimeStore";
import { getRuntimeResourcePolicy } from "@/lib/data-runtime/resourceRegistry";

describe("runtime reconciler", () => {
  it("suppresses no-op refresh updates for deep-equal payloads", () => {
    const equal = areResourcesEqual(
      { a: 1, nested: { b: 2 } },
      { nested: { b: 2 }, a: 1 },
      "deep"
    );

    expect(equal).toBe(true);
  });

  it("retains last-good data during background refresh merge", () => {
    const policy = getRuntimeResourcePolicy<{ value: number }>("home:banners", {
      compareStrategy: "deep",
      silentRefresh: true,
    });

    const result = reconcileResourceData({
      current: { value: 1 },
      lastGood: { value: 1 },
      incoming: { value: 1 },
      policy,
      isBackground: true,
    });

    expect(result.changed).toBe(false);
    expect(result.data).toEqual({ value: 1 });
    expect(result.lastGoodData).toEqual({ value: 1 });
  });
});

describe("runtime client retry + cooldown", () => {
  beforeEach(() => {
    useRuntimeStore.getState().clearAll();
  });

  it("retries transient failures and eventually stores data", async () => {
    let callCount = 0;

    registerRuntimeResource({
      key: "test:retry-success",
      scope: { visibility: "public" },
      policy: {
        staleTimeMs: 0,
        retry: {
          attempts: 3,
          baseDelayMs: 1,
          maxDelayMs: 5,
          jitterRatio: 0,
          cooldownMs: 20,
        },
      },
      fetcher: async () => {
        callCount += 1;
        if (callCount < 3) {
          throw new Error("Server has closed the connection");
        }
        return { ok: true, attempt: callCount };
      },
    });

    const data = await loadRuntimeResource<{ ok: boolean; attempt: number }>("test:retry-success", {
      force: true,
    });

    expect(callCount).toBe(3);
    expect(data).toEqual({ ok: true, attempt: 3 });
  });

  it("enters cooldown after exhausted retry attempts", async () => {
    let callCount = 0;

    registerRuntimeResource({
      key: "test:retry-fail",
      scope: { visibility: "public" },
      policy: {
        staleTimeMs: 0,
        retry: {
          attempts: 2,
          baseDelayMs: 1,
          maxDelayMs: 5,
          jitterRatio: 0,
          cooldownMs: 100,
        },
      },
      fetcher: async () => {
        callCount += 1;
        throw new Error("connection closed");
      },
    });

    await loadRuntimeResource("test:retry-fail", { force: true });
    const state = getRuntimeResourceState("test:retry-fail");

    expect(callCount).toBe(2);
    expect(state.cooldownUntil).not.toBeNull();
    expect((state.cooldownUntil ?? 0) > Date.now()).toBe(true);
  });
});
