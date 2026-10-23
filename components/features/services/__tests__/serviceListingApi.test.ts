import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ServiceListingApiError,
  publishServiceListing,
  saveServiceDraft,
} from "../serviceListingApi";
import { createDefaultWizardValues, type ServiceWizardValues } from "../wizardModel";

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  requireVendor: vi.fn().mockResolvedValue({ id: "vendor-1", sub: "user-1" }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function call(index: number): [string, RequestInit] {
  const entry = fetchMock.mock.calls[index];
  if (!entry) throw new Error(`fetch call ${index} was not made`);
  const [url, init] = entry as [string, RequestInit];
  return [url, init];
}

function bodyOf(index: number): Record<string, unknown> {
  const [, init] = call(index);
  return JSON.parse(typeof init.body === "string" ? init.body : "{}") as Record<string, unknown>;
}

function validValues(overrides: Partial<ServiceWizardValues> = {}): ServiceWizardValues {
  return {
    ...createDefaultWizardValues(),
    name: "Professional logo design",
    description: "I will design a professional logo for your brand.",
    shortDescription: "Three concepts in three days",
    mainImage: "https://res.cloudinary.com/demo/image/upload/logo.png",
    media: {
      images: ["https://res.cloudinary.com/demo/image/upload/logo.png"],
      documents: [],
      video: null,
    },
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

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saveServiceDraft (state → draft endpoint flow)", () => {
  it("creates a new listing then pins it offline (POST ignores isActive)", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ success: true, product: { id: "p1", isActive: true } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, product: { id: "p1", isActive: false } }),
      );

    const result = await saveServiceDraft({
      productId: null,
      values: validValues(),
      draftStep: 3,
      wasActive: false,
      vendorId: "vendor-1",
    });

    expect(result).toEqual({ product: { id: "p1", isActive: false }, created: true, offline: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [firstUrl, firstInit] = call(0);
    expect(firstUrl).toBe("/api/products");
    expect(firstInit.method).toBe("POST");
    expect(bodyOf(0)).toMatchObject({
      listingType: "SERVICE",
      isActive: false,
      vendorId: "vendor-1",
      serviceDetails: { draftStep: 3, deliveryMode: "DIGITAL" },
    });

    const [secondUrl, secondInit] = call(1);
    expect(secondUrl).toBe("/api/products/p1");
    expect(secondInit.method).toBe("PUT");
    expect(bodyOf(1)).toEqual({ isActive: false });
  });

  it("keeps the created row when the offline pin fails", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ success: true, product: { id: "p1", isActive: true } }),
      )
      .mockResolvedValueOnce(jsonResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403));

    const result = await saveServiceDraft({
      productId: null,
      values: validValues(),
      draftStep: 1,
      wasActive: false,
      vendorId: "vendor-1",
    });

    expect(result.created).toBe(true);
    expect(result.offline).toBe(false);
    expect(result.product.id).toBe("p1");
  });

  it("advances an existing draft with a single PUT", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, product: { id: "p9", isActive: false } }),
    );

    const result = await saveServiceDraft({
      productId: "p9",
      values: validValues(),
      draftStep: 4,
      wasActive: false,
      vendorId: "vendor-1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(call(0)[0]).toBe("/api/products/p9");
    expect(bodyOf(0)).toMatchObject({ isActive: false, serviceDetails: { draftStep: 4 } });
    expect(result).toMatchObject({ created: false, offline: true });
  });

  it("leaves an already-published listing live during the edit", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, product: { id: "p9", isActive: true } }),
    );

    await saveServiceDraft({
      productId: "p9",
      values: validValues(),
      draftStep: 2,
      wasActive: true,
      vendorId: "vendor-1",
    });

    expect(bodyOf(0)).not.toHaveProperty("isActive");
    expect(bodyOf(0)).toMatchObject({ serviceDetails: { draftStep: 2 } });
  });
});

describe("publishServiceListing (state → publish endpoint flow)", () => {
  it("publishes an existing row with isActive=true and no draft bookkeeping", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, product: { id: "p9", isActive: true } }),
    );

    const product = await publishServiceListing({
      productId: "p9",
      values: validValues(),
      vendorId: "vendor-1",
    });

    expect(product.isActive).toBe(true);
    expect(call(0)[0]).toBe("/api/products/p9");
    expect(call(0)[1].method).toBe("PUT");

    const payload = bodyOf(0);
    expect(payload.isActive).toBe(true);
    expect(payload).not.toHaveProperty("price");
    expect(payload).not.toHaveProperty("vendorId");
    expect(payload.serviceDetails).not.toHaveProperty("draftStep");
    expect(payload.images).toEqual(["https://res.cloudinary.com/demo/image/upload/logo.png"]);
  });

  it("creates and publishes a brand new listing in one request", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, product: { id: "p42", isActive: true } }),
    );

    await publishServiceListing({
      productId: null,
      values: validValues(),
      vendorId: "vendor-1",
    });

    expect(call(0)[0]).toBe("/api/products");
    expect(call(0)[1].method).toBe("POST");
    expect(bodyOf(0)).toMatchObject({ isActive: true, vendorId: "vendor-1" });
  });

  it("maps the shared API error envelope onto ServiceListingApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          error: "Service listing is not publishable",
          code: "SERVICE_NOT_PUBLISHABLE",
          issues: ["Add at least one image"],
        },
        400,
      ),
    );

    const failure = publishServiceListing({ productId: "p9", values: validValues() });

    await expect(failure).rejects.toBeInstanceOf(ServiceListingApiError);
    await expect(failure).rejects.toMatchObject({
      code: "SERVICE_NOT_PUBLISHABLE",
      issues: ["Add at least one image"],
      message: "Service listing is not publishable",
    });
  });

  it("falls back to a generic message when the envelope carries no error", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));

    await expect(publishServiceListing({ productId: "p9", values: validValues() })).rejects.toThrow(
      "Unable to save this listing",
    );
  });
});
