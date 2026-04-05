import { describe, it, expect } from "vitest";
import { getFirstValidImageUrl, getSafeImageUrl } from "@/lib/utils/images";

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
      null
    );
  });

  it("returns first allowed/safe image url only", () => {
    expect(
      getFirstValidImageUrl([
        "",
        " https://malicious.example.com/a.jpg ",
        "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      ])
    ).toBe("https://res.cloudinary.com/demo/image/upload/sample.jpg");
  });
});

describe("getSafeImageUrl", () => {
  it("accepts allowed local/remote image sources", () => {
    expect(getSafeImageUrl("/placeholder-product.jpg")).toBe("/placeholder-product.jpg");
    expect(getSafeImageUrl("https://images.unsplash.com/photo-1")).toBe("https://images.unsplash.com/photo-1");
    expect(getSafeImageUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg")).toBe(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    );
  });

  it("rejects unsupported or malformed image urls", () => {
    expect(getSafeImageUrl("https://evil.com/a.jpg")).toBeNull();
    expect(getSafeImageUrl("javascript:alert(1)")).toBeNull();
    expect(getSafeImageUrl("undefined")).toBeNull();
  });
});
