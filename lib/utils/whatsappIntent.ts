const VENDOR_NAME_MAX_LENGTH = 80;
const PRODUCT_NAME_MAX_LENGTH = 120;
const MESSAGE_MAX_LENGTH = 600;
const allowedSources = new Set(["vendor-profile", "product-page"]);

function safeTrim(value: string | null | undefined): string {
  return (value || "").trim();
}

function clamp(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function sanitizeContextUrl(value: string | null | undefined): string | null {
  const normalized = safeTrim(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeMessage(value: string | null | undefined): string | null {
  const normalized = safeTrim(value);
  if (!normalized) return null;
  return clamp(normalized, MESSAGE_MAX_LENGTH);
}

export function sanitizeWhatsAppSource(value: string | null | undefined): "vendor-profile" | "product-page" {
  const normalized = safeTrim(value).toLowerCase();
  return allowedSources.has(normalized)
    ? (normalized as "vendor-profile" | "product-page")
    : "vendor-profile";
}

export function sanitizeVendorName(value: string | null | undefined): string {
  const normalized = safeTrim(value);
  return normalized ? clamp(normalized, VENDOR_NAME_MAX_LENGTH) : "this vendor";
}

export function sanitizeProductName(value: string | null | undefined): string | null {
  const normalized = safeTrim(value);
  return normalized ? clamp(normalized, PRODUCT_NAME_MAX_LENGTH) : null;
}

export function buildProductWhatsAppMessage(params: {
  vendorName: string;
  productName: string;
  canonicalUrl: string;
}): string {
  const vendorName = sanitizeVendorName(params.vendorName);
  const productName = sanitizeProductName(params.productName) || "this product";
  const canonicalUrl = sanitizeContextUrl(params.canonicalUrl);
  return `Hello ${vendorName}, I found "${productName}" on MyHarvestHub and I’m interested in buying it. Is it available?\n${canonicalUrl || ""}`.trim();
}

export function buildVendorWhatsAppMessage(params: {
  vendorName: string;
  canonicalUrl: string;
}): string {
  const vendorName = sanitizeVendorName(params.vendorName);
  const canonicalUrl = sanitizeContextUrl(params.canonicalUrl);
  return `Hello ${vendorName}, I visited your store on MyHarvestHub and I’d like to ask about your products and delivery options.\n${canonicalUrl || ""}`.trim();
}

export function resolveWhatsAppIntentPayload(params: {
  source: string | null | undefined;
  vendorName: string | null | undefined;
  productName?: string | null | undefined;
  message?: string | null | undefined;
  contextUrl?: string | null | undefined;
}): {
  source: "vendor-profile" | "product-page";
  vendorName: string;
  contextUrl: string | null;
  message: string;
} {
  const source = sanitizeWhatsAppSource(params.source);
  const vendorName = sanitizeVendorName(params.vendorName);
  const contextUrl = sanitizeContextUrl(params.contextUrl);
  const explicitMessage = sanitizeMessage(params.message);

  if (explicitMessage) {
    return {
      source,
      vendorName,
      contextUrl,
      message: explicitMessage,
    };
  }

  if (source === "product-page") {
    return {
      source,
      vendorName,
      contextUrl,
      message: buildProductWhatsAppMessage({
        vendorName,
        productName: params.productName || "this product",
        canonicalUrl: contextUrl || "",
      }),
    };
  }

  return {
    source,
    vendorName,
    contextUrl,
    message: buildVendorWhatsAppMessage({
      vendorName,
      canonicalUrl: contextUrl || "",
    }),
  };
}
