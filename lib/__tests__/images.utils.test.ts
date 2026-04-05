import { describe, it, expect } from "vitest";
import { getFirstValidImageUrl } from "@/lib/utils/images";

describe("getFirstValidImageUrl", () => {
  it("returns null for nullish and non-array inputs", () => {
    expect(getFirstValidImageUrl(undefined)).toBeNull();
    expect(getFirstValidImageUrl(null)).toBeNull();
  });

  it("returns null when array has no valid image url", () => {
    expect(getFirstValidImageUrl([])).toBeNull();
    expect(getFirstValidImageUrl(["", "   "])).toBeNull();
  });

  it("returns first non-empty trimmed image url", () => {
    expect(getFirstValidImageUrl(["", "  https://example.com/a.jpg  ", "https://example.com/b.jpg"])).toBe(
      "https://example.com/a.jpg"
    );
  });
});
