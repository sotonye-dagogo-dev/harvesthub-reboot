import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// jose 6.x webapi build uses `payload instanceof Uint8Array` in FlattenedSign.
// Under vitest's jsdom environment, globalThis.TextEncoder.encode() returns a
// Uint8Array created in a different realm than the ambient global Uint8Array,
// so `instanceof` fails even though the value is a genuine Uint8Array. Align
// the global constructors to the realm that TextEncoder produces.
const probe = new TextEncoder().encode("probe");
const encoderRealmUint8Array = probe.constructor as typeof Uint8Array;
if (encoderRealmUint8Array && encoderRealmUint8Array !== globalThis.Uint8Array) {
  globalThis.Uint8Array = encoderRealmUint8Array;
  if (typeof window !== "undefined") {
    window.Uint8Array = encoderRealmUint8Array;
  }
}

// --- Deterministic Web Storage for the jsdom test environment -----------------
// Node 22+ ships experimental global localStorage/sessionStorage shims; on
// Node 25 the shim is a method-less stub and jsdom 27 delegates its own
// window.localStorage to it (verified: same object, configurable descriptor).
// That broke storage-dependent suites (e.g. bannerTracking's
// `localStorage.clear()`) and silently disabled persistence in others.
// Per repair-system.md ("Search UI crashes in tests/runtimes where localStorage
// is non-standard"), install a deterministic in-memory Storage whenever the
// ambient one lacks the Storage methods. Test-infra only — no runtime impact.
function createMemoryStorage(): Storage {
  let data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    getItem(key: string) {
      return data.has(String(key)) ? (data.get(String(key)) as string) : null;
    },
    setItem(key: string, value: string) {
      data.set(String(key), String(value));
    },
    removeItem(key: string) {
      data.delete(String(key));
    },
    clear() {
      data = new Map<string, string>();
    },
  } as Storage;
}

function isFunctionalStorage(value: unknown): value is Storage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Storage).getItem === "function" &&
    typeof (value as Storage).setItem === "function" &&
    typeof (value as Storage).removeItem === "function" &&
    typeof (value as Storage).clear === "function"
  );
}

function ensureFunctionalStorage(name: "localStorage" | "sessionStorage"): void {
  const ambient = (globalThis as Record<string, unknown>)[name];
  if (isFunctionalStorage(ambient)) return;
  const storage = createMemoryStorage();
  Object.defineProperty(globalThis, name, {
    value: storage,
    configurable: true,
    writable: true,
  });
  if (typeof window !== "undefined") {
    try {
      Object.defineProperty(window, name, {
        value: storage,
        configurable: true,
        writable: true,
      });
    } catch {
      // jsdom window refused redefinition; the globalThis replacement is sufficient.
    }
  }
}

ensureFunctionalStorage("localStorage");
ensureFunctionalStorage("sessionStorage");

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));
