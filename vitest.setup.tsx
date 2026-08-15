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
