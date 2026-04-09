import { describe, expect, it } from "vitest";
import {
  getRuntimeActivityMessage,
  shouldShowRuntimeActivity,
} from "@/lib/config/runtimeActivityCopy";

describe("runtime activity copy policy", () => {
  it("uses human-readable tiered copy", () => {
    expect(getRuntimeActivityMessage(1)).toBe("Just a moment");
    expect(getRuntimeActivityMessage(3)).toBe("Almost there");
    expect(getRuntimeActivityMessage(7)).toBe("This might take a while");
  });

  it("suppresses short churn and allows long-running visibility", () => {
    expect(shouldShowRuntimeActivity(1, 500)).toBe(false);
    expect(shouldShowRuntimeActivity(1, 4500)).toBe(true);
    expect(shouldShowRuntimeActivity(2, 1000)).toBe(false);
    expect(shouldShowRuntimeActivity(2, 2000)).toBe(true);
    expect(shouldShowRuntimeActivity(4, 800)).toBe(true);
  });
});
