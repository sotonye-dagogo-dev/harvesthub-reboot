import { describe, expect, it } from "vitest";
import { buildDynamicEntityMetadata } from "@/lib/seo/dynamicMetadata";

describe("dynamic metadata fallback parity", () => {
  it("builds canonical title/description/image/url with OG and twitter parity", () => {
    const metadata = buildDynamicEntityMetadata({
      baseUrl: "https://myharvesthub.example",
      path: "/products/p1",
      title: "Fresh Tomatoes | MyHarvestHub",
      description: "Organic tomatoes",
      imageUrl: "https://cdn.example/image.jpg",
    });

    expect(metadata.title).toBe("Fresh Tomatoes | MyHarvestHub");
    expect(metadata.description).toBe("Organic tomatoes");
    expect(metadata.alternates?.canonical).toBe("https://myharvesthub.example/products/p1");
    expect(metadata.openGraph?.url).toBe("https://myharvesthub.example/products/p1");
    const openGraphImages = Array.isArray(metadata.openGraph?.images)
      ? metadata.openGraph?.images
      : metadata.openGraph?.images
        ? [metadata.openGraph.images]
        : [];
    const twitterImages = Array.isArray(metadata.twitter?.images)
      ? metadata.twitter?.images
      : metadata.twitter?.images
        ? [metadata.twitter.images]
        : [];
    expect(openGraphImages[0]).toMatchObject({ url: "https://cdn.example/image.jpg" });
    expect(twitterImages[0]).toBe("https://cdn.example/image.jpg");
  });

  it("falls back safely when fields are missing", () => {
    const metadata = buildDynamicEntityMetadata({
      baseUrl: "https://myharvesthub.example",
      path: "/vendors/v1",
      title: "",
      description: "",
      imageUrl: "",
      fallbackTitle: "Vendor | MyHarvestHub",
      fallbackDescription: "Discover trusted vendors.",
    });

    expect(metadata.title).toBe("Vendor | MyHarvestHub");
    expect(metadata.description).toBe("Discover trusted vendors.");
    const openGraphImages = Array.isArray(metadata.openGraph?.images)
      ? metadata.openGraph?.images
      : metadata.openGraph?.images
        ? [metadata.openGraph.images]
        : [];
    expect(openGraphImages[0]).toMatchObject({
      url: "https://myharvesthub.example/myharvesthublogo.png",
    });
  });
});
