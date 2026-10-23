import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/admin/option-lists/[key]/route";

const { mockGetCurrentUser, mockPrisma } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockPrisma: {
    optionList: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils/auth", () => ({ getCurrentUser: () => mockGetCurrentUser() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

const context = (key: string) => ({ params: Promise.resolve({ key }) });

const putRequest = (body: unknown) =>
  new NextRequest("http://localhost/api/admin/option-lists/campus", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentUser.mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
  mockPrisma.optionList.findUnique.mockResolvedValue(null);
  mockPrisma.optionList.upsert.mockResolvedValue({});
});

describe("PUT /api/admin/option-lists/[key]", () => {
  it("rejects non-admin callers", async () => {
    mockGetCurrentUser.mockResolvedValue({ userId: "u-1", role: "BUYER" });

    const res = await PUT(putRequest({ options: [] }), context("campus"));

    expect(res.status).toBe(403);
  });

  it("404s an unregistered key", async () => {
    const res = await PUT(putRequest({ options: [] }), context("not-a-list"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("OPTION_LIST_NOT_FOUND");
    expect(mockPrisma.optionList.upsert).not.toHaveBeenCalled();
  });

  it("rejects a body without an options array", async () => {
    const res = await PUT(putRequest({ nope: true }), context("campus"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("OPTION_LIST_INVALID_OPTIONS");
  });

  it("rejects a malformed options payload", async () => {
    const res = await PUT(putRequest({ options: [{ value: "LONDON" }] }), context("campus"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(mockPrisma.optionList.upsert).not.toHaveBeenCalled();
  });

  it("rejects injecting a value into a DISPLAY list", async () => {
    const res = await PUT(
      putRequest({ options: [{ value: "MARS_BASE", label: "Mars Base" }] }),
      context("campus"),
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("OPTION_LIST_VALUE_NOT_ALLOWED");
    expect(mockPrisma.optionList.upsert).not.toHaveBeenCalled();
  });

  it("persists a valid DISPLAY payload", async () => {
    const options = [
      { value: "LONDON", label: "London" },
      { value: "ABUJA", label: "Abuja", hidden: true },
    ];
    mockPrisma.optionList.findUnique.mockResolvedValue({
      key: "campus",
      options,
      isActive: true,
      updatedAt: new Date(),
      updatedBy: "admin-1",
    });

    const res = await PUT(putRequest({ options }), context("campus"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.optionList.upsert).toHaveBeenCalledTimes(1);
    const savedValues = json.list.options.map((row: { value: string }) => row.value);
    // Stored rows come first, in the order the admin saved them.
    expect(savedValues.slice(0, 2)).toEqual(["LONDON", "ABUJA"]);
    // Every legal enum value is still present (DISPLAY lists can hide, not delete).
    expect(new Set(savedValues)).toEqual(
      new Set(["LONDON", "ABUJA", "BIRMINGHAM", "GLASGOW", "MANCHESTER", "HOUSTON",
        "NORTH_LONDON", "KENT", "TORONTO", "GBAGADA", "MAGODO", "IKORODU",
        "IBADAN_JERICHO", "AKOBO", "APAPA", "SURULERE", "ABEOKUTA", "ILUPEJU",
        "YABA", "PORT_HARCOURT", "OLUYOLE", "OGBA", "ANTHONY", "ALIMOSHO",
        "IKEJA", "IKOYI", "ISOLO", "IYANA_IPAJA", "ABULE_EGBA", "GHANA",
        "LEKKI", "GLOBE", "AJAH", "ONLINE"]),
    );
  });
});

describe("GET /api/admin/option-lists/[key]", () => {
  it("includes the legal value set so the editor can disable value editing", async () => {
    mockPrisma.optionList.findUnique.mockResolvedValue(null);

    const res = await GET(
      new NextRequest("http://localhost/api/admin/option-lists/serviceLocations"),
      context("serviceLocations"),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.list.allowedValues).toEqual(["ON_SITE", "REMOTE", "BOTH"]);
    expect(json.list.tier).toBe("DISPLAY");
    expect(json.list.fallback).toBe(true);
  });
});
