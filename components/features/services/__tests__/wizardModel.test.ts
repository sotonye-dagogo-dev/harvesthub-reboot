import { beforeEach, describe, expect, it } from "vitest";
import {
  STEP_BASICS,
  STEP_LOCATION,
  STEP_MEDIA,
  STEP_PACKAGES,
  STEP_REQUIREMENTS,
  activeStepIndices,
  buildCreateDraftPayload,
  buildDraftPayload,
  buildPublishPayload,
  buildServiceDetails,
  clampDraftStep,
  clearServiceListingLocalDraft,
  createDefaultWizardValues,
  galleryImages,
  loadServiceListingLocalDraft,
  packagesForTierCount,
  restoreWizardState,
  saveServiceListingLocalDraft,
  serviceListingDraftScope,
  stepFieldErrors,
  stepForPublishIssue,
  stepLabelsFor,
  validateAllSteps,
  validateStep,
  valuesFromProduct,
  type ServiceWizardValues,
} from "../wizardModel";
import { SERVICE_LISTING_DRAFT_VERSION, serviceListingDraftKey } from "@/lib/utils/localDraft";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import { ServiceCategory, ServiceRateType } from "@/lib/constants";
import type { Product } from "@/lib/types";

const COVER = "https://res.cloudinary.com/demo/image/upload/logo.png";

function validValues(overrides: Partial<ServiceWizardValues> = {}): ServiceWizardValues {
  return {
    ...createDefaultWizardValues(),
    name: "Professional logo design",
    serviceCategory: "CREATIVE",
    rateType: "FIXED",
    description: "I will design a professional logo for your brand.",
    shortDescription: "Three concepts in three days",
    mainImage: COVER,
    deliveryMode: "DIGITAL",
    packages: [
      {
        tier: "BASIC",
        title: "Logo design",
        description: "Three concepts",
        price: 15000,
        deliveryDays: 3,
        revisions: 2,
        extras: [],
      },
    ],
    ...overrides,
  };
}

function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Professional logo design",
    description: "I will design a professional logo for your brand.",
    category: "SERVICES",
    price: 15000,
    stock: 999999,
    isActive: false,
    mainImage: COVER,
    images: [COVER],
    listingType: "SERVICE",
    serviceDetails: { draftStep: 1, deliveryMode: "DIGITAL" },
    ...overrides,
  } as Product;
}

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    },
  });
});

describe("step validation (delegates to SERVICE_STEP_SCHEMAS)", () => {
  it("passes a fully filled digital listing through every active step", () => {
    expect(validateAllSteps(validValues())).toBeNull();
  });

  it("reports the first issue of the current step", () => {
    const values = validValues({ name: "" });
    const message = validateStep(STEP_BASICS, values);

    expect(message).toContain("Title");
    expect(stepFieldErrors(STEP_BASICS, values)).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: ["name"] })]),
    );
  });

  it("requires the enum-backed basics fields", () => {
    expect(validateStep(STEP_BASICS, validValues({ serviceCategory: "", rateType: "" }))).toBe(
      "Please select a service category",
    );
  });

  it("rejects a malformed cover or gallery URL on the media step", () => {
    const values = validValues({
      mainImage: "",
      media: { images: ["not-a-url"], documents: [], video: null },
    });

    expect(validateStep(STEP_MEDIA, values)).toBe("Image must be a valid URL");
  });

  it("rejects more PDFs than SERVICE_LIMITS.maxPdfs", () => {
    const documents = [
      "https://example.com/brief.pdf",
      "https://example.com/portfolio.pdf",
      "https://example.com/extra.pdf",
    ];
    const values = validValues({ media: { images: [], documents, video: null } });

    expect(validateStep(STEP_MEDIA, values)).toBe(`Maximum ${SERVICE_LIMITS.maxPdfs} documents`);
  });

  it("trims the gallery to the image cap so the step can never self-reject", () => {
    const images = Array.from(
      { length: SERVICE_LIMITS.maxImages + 3 },
      (_, index) => `https://example.com/image-${index}.png`,
    );
    const values = validValues({ media: { images, documents: [], video: null } });

    expect(galleryImages(values)).toHaveLength(SERVICE_LIMITS.maxImages);
    expect(validateStep(STEP_MEDIA, values)).toBeNull();
  });

  it("keeps geo payloads out of digital services (PRD TC-001)", () => {
    const digital = validValues({
      geo: { address: "12 Knowledge Avenue" },
      deliveryMode: "DIGITAL",
    });

    expect(validateStep(STEP_LOCATION, digital)).toContain(
      "Location details are only allowed for on-site services",
    );
    expect(buildServiceDetails(digital)).not.toHaveProperty("geo");
    expect(buildServiceDetails(digital).deliveryMode).toBe("DIGITAL");
  });

  it("requires an address once the delivery mode is on-site", () => {
    const onSite = validValues({ deliveryMode: "ON_SITE", geo: { address: "" } });

    expect(validateStep(STEP_LOCATION, onSite)).toBe(
      "Add the address where you render this service",
    );
  });

  it("needs at least one choice option for SELECT requirement fields", () => {
    const values = validValues({
      requirementFields: [{ key: "STYLE", label: "Style", type: "SELECT", options: [], required: true }],
    });

    expect(validateStep(STEP_REQUIREMENTS, values)).toBe(
      "Choice fields need at least one option",
    );
    expect(stepFieldErrors(STEP_REQUIREMENTS, values)).toEqual([
      { name: ["requirementFields", 0, "options"], errors: ["Choice fields need at least one option"] },
    ]);
  });

  it("rejects a package that is under a naira", () => {
    const values = validValues({
      packages: [
        {
          tier: "BASIC",
          title: "Logo design",
          description: "",
          price: 0,
          deliveryDays: 3,
          revisions: 1,
          extras: [],
        },
      ],
    });

    expect(validateStep(STEP_PACKAGES, values)).toContain("at least");
  });

  it("sends validation to the first failing step", () => {
    const result = validateAllSteps(validValues({ name: "", mainImage: "" }));

    expect(result?.step).toBe(STEP_BASICS);
  });
});

describe("step indices and labels", () => {
  it("drops the location step for digital services", () => {
    expect(activeStepIndices("DIGITAL")).toEqual([STEP_BASICS, STEP_PACKAGES, STEP_MEDIA, STEP_REQUIREMENTS]);
    expect(stepLabelsFor("DIGITAL")).not.toContain("Location");
    expect(activeStepIndices("ON_SITE")).toHaveLength(5);
    expect(stepLabelsFor("ON_SITE")).toEqual(["Basics", "Packages", "Location", "Media", "Requirements"]);
  });

  it("clamps a stored draft step back onto the active list", () => {
    expect(clampDraftStep("DIGITAL", STEP_LOCATION)).toBe(STEP_PACKAGES);
    expect(clampDraftStep("ON_SITE", STEP_REQUIREMENTS)).toBe(STEP_REQUIREMENTS);
    expect(clampDraftStep("DIGITAL", 99)).toBe(STEP_REQUIREMENTS);
  });
});

describe("draft advance payloads", () => {
  it("marks a new listing as an inactive draft with the reached step", () => {
    const payload = buildDraftPayload(validValues(), {
      draftStep: STEP_MEDIA,
      wasActive: false,
      vendorId: "vendor-1",
    });

    expect(payload.isActive).toBe(false);
    expect(payload.listingType).toBe("SERVICE");
    expect(payload.vendorId).toBe("vendor-1");
    expect(payload.serviceDetails.draftStep).toBe(STEP_MEDIA);
  });

  it("keeps an already-published listing live while it is edited", () => {
    const payload = buildDraftPayload(validValues(), { draftStep: STEP_PACKAGES, wasActive: true });

    expect(payload.isActive).toBeUndefined();
    expect(payload.serviceDetails.draftStep).toBe(STEP_PACKAGES);
  });

  it("prices a brand new draft from its base package", () => {
    const payload = buildCreateDraftPayload(validValues(), { draftStep: STEP_BASICS, vendorId: "vendor-1" });

    expect(payload.price).toBe(15000);
    expect(payload.vendorId).toBe("vendor-1");
    expect(payload.isActive).toBe(false);
  });

  it("falls back to the placeholder price before a package exists", () => {
    const payload = buildCreateDraftPayload(validValues({ packages: [] }), {
      draftStep: STEP_BASICS,
      vendorId: "vendor-1",
    });

    expect(payload.price).toBe(1);
  });
});

describe("publish payload", () => {
  it("sends isActive=true and leaves price and stock to the server", () => {
    const payload = buildPublishPayload(validValues(), { creating: false });

    expect(payload.isActive).toBe(true);
    expect(payload.serviceDetails).not.toHaveProperty("draftStep");
    expect(payload).not.toHaveProperty("price");
    expect(payload).not.toHaveProperty("stock");
    expect(payload.images).toEqual([COVER]);
  });

  it("carries the vendor id only when the row still has to be created", () => {
    const creating = buildPublishPayload(validValues(), { creating: true, vendorId: "vendor-1" });
    const editing = buildPublishPayload(validValues(), { creating: false, vendorId: "vendor-1" });

    expect(creating.vendorId).toBe("vendor-1");
    expect(editing.vendorId).toBeUndefined();
  });

  it("routes a publish-gate complaint back to the offending step", () => {
    expect(stepForPublishIssue("Add at least one image")).toBe(STEP_MEDIA);
    expect(stepForPublishIssue("Add at least one package before publishing")).toBe(STEP_PACKAGES);
    expect(stepForPublishIssue("Description must be at least 10 characters")).toBe(STEP_BASICS);
    expect(stepForPublishIssue("something unexpected")).toBe(STEP_BASICS);
  });
});

describe("media limits", () => {
  it("merges the cover into the gallery and caps it at SERVICE_LIMITS.maxImages", () => {
    const images = Array.from({ length: 6 }, (_, index) => `https://example.com/${index}.png`);
    const gallery = galleryImages(validValues({ media: { images, documents: [], video: null } }));

    expect(gallery).toHaveLength(SERVICE_LIMITS.maxImages);
    expect(gallery[0]).toBe(COVER);
    expect(new Set(gallery).size).toBe(gallery.length);
  });

  it("slices documents to the PDF cap when writing serviceDetails", () => {
    const documents = [
      "https://example.com/brief.pdf",
      "https://example.com/portfolio.pdf",
      "https://example.com/extra.pdf",
    ];
    const details = buildServiceDetails(validValues({ media: { images: [], documents, video: null } }));

    expect(details.media?.documents).toHaveLength(SERVICE_LIMITS.maxPdfs);
    expect(details.media?.images).toEqual([COVER]);
  });

  it("keeps the 1-tile / 3-tier package rule intact when the mode flips", () => {
    const three = packagesForTierCount(validValues().packages, 3);
    expect(three.map((entry) => entry.tier)).toEqual(["BASIC", "STANDARD", "PREMIUM"]);

    const backToOne = packagesForTierCount(three, 1);
    expect(backToOne).toHaveLength(1);
    expect(backToOne[0]?.title).toBe("Logo design");
  });
});

describe("draft restore", () => {
  it("round-trips values through the namespaced local draft", () => {
    const scope = serviceListingDraftScope("user-1", null);
    const values = validValues({ name: "Saved title" });

    saveServiceListingLocalDraft(scope, { productId: null, step: STEP_PACKAGES, values });

    const restored = loadServiceListingLocalDraft(scope);
    expect(restored?.step).toBe(STEP_PACKAGES);
    expect(restored?.values.name).toBe("Saved title");
  });

  it("prefers the local instant draft over the server draft", () => {
    const scope = serviceListingDraftScope("user-1", "product-1");
    saveServiceListingLocalDraft(scope, {
      productId: "product-1",
      step: STEP_MEDIA,
      values: validValues({ name: "Local wins" }),
    });

    const restored = restoreWizardState({
      scope,
      product: productFixture({ serviceDetails: { draftStep: STEP_PACKAGES } }),
    });

    expect(restored.step).toBe(STEP_MEDIA);
    expect(restored.values.name).toBe("Local wins");
  });

  it("falls back to the server-side draftStep when there is no local draft", () => {
    const restored = restoreWizardState({
      scope: serviceListingDraftScope("user-1", "product-1"),
      product: productFixture({ serviceDetails: { draftStep: STEP_REQUIREMENTS } }),
    });

    expect(restored.step).toBe(STEP_REQUIREMENTS);
    expect(restored.values.name).toBe("Professional logo design");
  });

  it("ignores a local draft written for a different listing", () => {
    saveServiceListingLocalDraft(serviceListingDraftScope("user-1", "product-1"), {
      productId: "product-1",
      step: STEP_MEDIA,
      values: validValues({ name: "Another listing" }),
    });

    const restored = restoreWizardState({
      scope: serviceListingDraftScope("user-1", null),
      product: null,
    });

    expect(restored.values.name).toBe("");
    expect(restored.step).toBe(STEP_BASICS);
  });

  it("discards a local draft written by an older bundle version", () => {
    const scope = serviceListingDraftScope("user-1", null);
    saveServiceListingLocalDraft(scope, {
      productId: null,
      step: STEP_PACKAGES,
      values: validValues(),
    });

    window.localStorage.setItem(
      serviceListingDraftKey(scope),
      JSON.stringify({
        version: SERVICE_LISTING_DRAFT_VERSION + 1,
        savedAt: Date.now(),
        payload: { productId: null, step: 9, values: validValues() },
      }),
    );

    expect(loadServiceListingLocalDraft(scope)).toBeNull();
  });

  it("round-trips values read back from a published listing", () => {
    const values = valuesFromProduct(
      productFixture({
        isActive: true,
        serviceDetails: {
          draftStep: undefined,
          deliveryMode: "ON_SITE",
          serviceCategory: ServiceCategory.CREATIVE,
          rateType: ServiceRateType.FIXED,
          description: "Published description",
          geo: { address: "12 Knowledge Avenue" },
          packages: [
            {
              tier: "BASIC",
              title: "Logo design",
              description: "Three concepts",
              price: 20000,
              deliveryDays: 4,
              revisions: 1,
              extras: [],
            },
          ],
          media: { images: [COVER], documents: [], video: null },
          requirementFields: [{ key: "BRAND", label: "Brand", type: "TEXT", required: true }],
        },
      }),
    );

    expect(values.deliveryMode).toBe("ON_SITE");
    expect(values.geo.address).toBe("12 Knowledge Avenue");
    expect(values.packages[0]?.price).toBe(20000);
    expect(values.requirementFields[0]?.key).toBe("BRAND");
    expect(validateAllSteps(values)).toBeNull();

    clearServiceListingLocalDraft(serviceListingDraftScope("user-1", null));
    expect(loadServiceListingLocalDraft(serviceListingDraftScope("user-1", null))).toBeNull();
  });
});
