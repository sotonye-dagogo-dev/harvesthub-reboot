import { describe, expect, it } from "vitest";
import {
  SERVICE_STEP_SCHEMAS,
  assertPublishableServiceDetails,
  baseServicePrice,
  serviceDetailsSchema,
  servicePackagesSchema,
  serviceRequirementFieldSchema,
  validateServiceStep,
} from "@/lib/schemas/service.schemas";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import { ServiceCategory, ServiceLocation, ServiceRateType } from "@/lib/constants";

const basicPackage = {
  tier: "BASIC" as const,
  title: "Logo design",
  description: "Three concepts",
  price: 15000,
  deliveryDays: 3,
  revisions: 2,
  extras: [],
};

const validDetails = {
  deliveryMode: "DIGITAL" as const,
  description: "A professional logo for your brand.",
  serviceCategory: ServiceCategory.CREATIVE,
  rateType: ServiceRateType.FIXED,
  location: ServiceLocation.REMOTE,
  packages: [basicPackage],
  requirementFields: [],
  media: { images: ["https://res.cloudinary.com/demo/image/upload/logo.png"], documents: [], video: null },
};

describe("serviceDetailsSchema", () => {
  it("accepts a minimal digital service", () => {
    const result = serviceDetailsSchema.safeParse(validDetails);
    expect(result.success).toBe(true);
  });

  it("accepts a legacy booking-only payload", () => {
    const result = serviceDetailsSchema.safeParse({
      serviceCategory: ServiceCategory.GROOMING,
      rateType: ServiceRateType.HOURLY,
      rate: 5000,
      location: ServiceLocation.ON_SITE,
      requiresConsultation: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a digital service that carries a geo payload (TC-001)", () => {
    const result = serviceDetailsSchema.safeParse({
      ...validDetails,
      geo: { address: "12 Example Road" },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("geo"))).toBe(true);
  });

  it("requires an address for on-site services", () => {
    const result = serviceDetailsSchema.safeParse({ ...validDetails, deliveryMode: "ON_SITE" });
    expect(result.success).toBe(false);
  });

  it("accepts an on-site service with an address", () => {
    const result = serviceDetailsSchema.safeParse({
      ...validDetails,
      deliveryMode: "ON_SITE",
      geo: { address: "12 Example Road" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than three packages", () => {
    const result = serviceDetailsSchema.safeParse({
      ...validDetails,
      packages: [basicPackage, { ...basicPackage, tier: "STANDARD" }, { ...basicPackage, tier: "PREMIUM" }, { ...basicPackage, tier: "BASIC" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate tiers", () => {
    const result = servicePackagesSchema.safeParse([basicPackage, { ...basicPackage, title: "Second" }]);
    expect(result.success).toBe(false);
  });

  it("requires all three tiers when three packages are used", () => {
    const result = servicePackagesSchema.safeParse([
      basicPackage,
      { ...basicPackage, tier: "STANDARD" },
      { ...basicPackage, tier: "BASIC" },
    ]);
    expect(result.success).toBe(false);
  });

  it("enforces the delivery window bounds", () => {
    expect(servicePackagesSchema.safeParse([{ ...basicPackage, deliveryDays: 0 }]).success).toBe(false);
    expect(
      servicePackagesSchema.safeParse([{ ...basicPackage, deliveryDays: SERVICE_LIMITS.deliveryDaysMax + 1 }])
        .success,
    ).toBe(false);
  });

  it("enforces the description limit", () => {
    const result = serviceDetailsSchema.safeParse({
      ...validDetails,
      description: "x".repeat(SERVICE_LIMITS.descriptionMax + 1),
    });
    expect(result.success).toBe(false);
  });

  it("caps the media allowances", () => {
    const tooManyImages = Array.from({ length: SERVICE_LIMITS.maxImages + 1 }, (_, index) => `https://example.com/${index}.png`);
    const result = serviceDetailsSchema.safeParse({
      ...validDetails,
      media: { images: tooManyImages, documents: [], video: null },
    });
    expect(result.success).toBe(false);
  });
});

describe("requirement fields", () => {
  it("requires options for choice fields", () => {
    const result = serviceRequirementFieldSchema.safeParse({
      key: "STYLE",
      label: "Preferred style",
      type: "SELECT",
      required: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects options on free-text fields", () => {
    const result = serviceRequirementFieldSchema.safeParse({
      key: "BRIEF",
      label: "Brief",
      type: "TEXT",
      options: ["nope"],
      required: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a key that is not UPPER_SNAKE_CASE", () => {
    const result = serviceRequirementFieldSchema.safeParse({
      key: "not a key",
      label: "Brief",
      type: "TEXT",
      required: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("publish gate", () => {
  it("blocks publishing without packages", () => {
    const issues = assertPublishableServiceDetails({ ...validDetails, packages: undefined });
    expect(issues.some((issue) => issue.includes("package"))).toBe(true);
  });

  it("blocks publishing without a description", () => {
    const issues = assertPublishableServiceDetails({ ...validDetails, description: "short" });
    expect(issues.some((issue) => issue.includes("Description"))).toBe(true);
  });

  it("allows a complete service to publish", () => {
    expect(assertPublishableServiceDetails(validDetails)).toEqual([]);
  });

  it("reads the price off the base package", () => {
    expect(baseServicePrice(validDetails)).toBe(15000);
    expect(baseServicePrice({})).toBeNull();
  });
});

describe("wizard step validation", () => {
  it("has five step schemas", () => {
    expect(SERVICE_STEP_SCHEMAS).toHaveLength(5);
  });

  it("rejects a title over the service limit", () => {
    const message = validateServiceStep(0, {
      name: "x".repeat(SERVICE_LIMITS.titleMax + 1),
      serviceCategory: ServiceCategory.CREATIVE,
      rateType: ServiceRateType.FIXED,
      description: "A perfectly valid description",
      mainImage: "https://example.com/a.png",
      deliveryMode: "DIGITAL",
      category: "CREATIVE",
    });
    expect(message).toBeTypeOf("string");
  });

  it("returns null for a valid packages step", () => {
    expect(validateServiceStep(1, { packages: [basicPackage] })).toBeNull();
  });

  it("fails an on-site location step without an address", () => {
    expect(validateServiceStep(2, { deliveryMode: "ON_SITE" })).toBeTypeOf("string");
  });

  it("rejects an unknown step", () => {
    expect(validateServiceStep(99, {})).toBe("Unknown step");
  });
});
