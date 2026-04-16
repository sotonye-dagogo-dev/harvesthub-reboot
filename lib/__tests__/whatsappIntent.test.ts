import { describe, expect, it } from "vitest";
import {
  buildProductWhatsAppMessage,
  buildVendorWhatsAppMessage,
  resolveWhatsAppIntentPayload,
} from "@/lib/utils/whatsappIntent";

describe("whatsapp intent helpers", () => {
  it("builds product-origin prefill message with canonical url", () => {
    const message = buildProductWhatsAppMessage({
      vendorName: "Fresh Hub",
      productName: "Fresh Tomatoes",
      canonicalUrl: "https://myharvesthub.example/products/p1",
    });
    expect(message).toContain("Fresh Tomatoes");
    expect(message).toContain("https://myharvesthub.example/products/p1");
  });

  it("builds vendor-origin prefill message with canonical url", () => {
    const message = buildVendorWhatsAppMessage({
      vendorName: "Fresh Hub",
      canonicalUrl: "https://myharvesthub.example/vendors/v1",
    });
    expect(message).toContain("Fresh Hub");
    expect(message).toContain("https://myharvesthub.example/vendors/v1");
  });

  it("uses explicit message when provided and preserves normalized source", () => {
    const payload = resolveWhatsAppIntentPayload({
      source: "product-page",
      vendorName: "Fresh Hub",
      message: "Hello there",
      contextUrl: "https://myharvesthub.example/products/p1",
    });
    expect(payload.source).toBe("product-page");
    expect(payload.message).toBe("Hello there");
  });
});
