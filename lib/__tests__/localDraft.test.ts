import { describe, expect, it, beforeEach } from "vitest";
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from "@/lib/utils/localDraft";

describe("localDraft utilities", () => {
  const key = "myharvesthub.test.draft";
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

  it("saves and loads draft payloads", () => {
    const payload = { name: "Ada", email: "ada@example.com", count: 2 };
    saveLocalDraft(key, payload);

    expect(loadLocalDraft<typeof payload>(key)).toEqual(payload);
  });

  it("returns null for invalid JSON payloads", () => {
    window.localStorage.setItem(key, "{invalid-json");

    expect(loadLocalDraft(key)).toBeNull();
  });

  it("clears previously stored drafts", () => {
    saveLocalDraft(key, { status: "pending" });
    clearLocalDraft(key);

    expect(window.localStorage.getItem(key)).toBeNull();
    expect(loadLocalDraft(key)).toBeNull();
  });
});
