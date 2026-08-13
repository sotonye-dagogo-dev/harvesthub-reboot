import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { SwNoResponseGuard } from "@/lib/utils/swNoResponseGuard";

describe("SwNoResponseGuard", () => {
  const dispatchRejection = (reason: unknown): boolean => {
    const event = new Event("unhandledrejection");
    Object.defineProperty(event, "reason", { value: reason });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);
    return preventDefaultSpy.mock.calls.length > 0;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("suppresses the serwist no-response unhandled rejection", () => {
    const { unmount } = render(<SwNoResponseGuard />);
    expect(
      dispatchRejection(
        new Error(
          'no-response::[{"url":"https://www.myharvesthub.org/signup/verification-docs"}]'
        )
      )
    ).toBe(true);
    unmount();
  });

  it("suppresses rejections whose name or code is no-response", () => {
    const { unmount } = render(<SwNoResponseGuard />);
    const named = Object.assign(new Error("boom"), { name: "no-response" });
    const coded = Object.assign(new Error("boom"), { code: "no-response" });
    expect(dispatchRejection(named)).toBe(true);
    expect(dispatchRejection(coded)).toBe(true);
    unmount();
  });

  it("does not suppress unrelated unhandled rejections", () => {
    const { unmount } = render(<SwNoResponseGuard />);
    expect(dispatchRejection(new Error("boom"))).toBe(false);
    unmount();
  });

  it("removes the listener on unmount", () => {
    const { unmount } = render(<SwNoResponseGuard />);
    unmount();
    expect(dispatchRejection(new Error('no-response::[{"url":"/"}]'))).toBe(false);
  });
});
