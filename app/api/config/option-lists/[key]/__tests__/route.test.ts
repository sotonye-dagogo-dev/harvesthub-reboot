import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/config/option-lists/[key]/route";
import { OPTION_LIST_FALLBACKS } from "@/lib/config/optionLists";

const { mockGetOptionList } = vi.hoisted(() => ({
  mockGetOptionList: vi.fn(),
}));

vi.mock("@/lib/services/optionLists", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/services/optionLists")>();
  return { ...actual, getOptionList: (...args: unknown[]) => mockGetOptionList(...args) };
});

const context = (key: string) => ({ params: Promise.resolve({ key }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/config/option-lists/[key]", () => {
  it("returns the option list with visible rows", async () => {
    mockGetOptionList.mockResolvedValue({
      key: "campus",
      tier: "DISPLAY",
      label: "Campuses",
      options: [
        { value: "LONDON", label: "London" },
        { value: "ABUJA", label: "Abuja", hidden: true },
      ],
      fallback: false,
      isActive: true,
    });

    const res = await GET(new NextRequest("http://localhost/api/config/option-lists/campus"), context("campus"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.key).toBe("campus");
    expect(json.options).toHaveLength(2);
    expect(json.visible.map((row: { value: string }) => row.value)).toEqual(["LONDON"]);
    expect(json.fallback).toBe(false);
  });

  it("answers 404 with the OPTION_LIST_NOT_FOUND envelope for an unregistered key", async () => {
    mockGetOptionList.mockResolvedValue(null);

    const res = await GET(
      new NextRequest("http://localhost/api/config/option-lists/nope"),
      context("nope"),
    );
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.code).toBe("OPTION_LIST_NOT_FOUND");
    expect(json.key).toBe("nope");
  });

  it("still answers 200 with code fallbacks when the DB is down", async () => {
    // The service swallows DB errors, so the route never sees an exception.
    mockGetOptionList.mockResolvedValue({
      key: "serviceTiers",
      tier: "DISPLAY",
      label: "Service package tiers",
      options: [...OPTION_LIST_FALLBACKS.serviceTiers],
      fallback: true,
      isActive: true,
    });

    const res = await GET(
      new NextRequest("http://localhost/api/config/option-lists/serviceTiers"),
      context("serviceTiers"),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.fallback).toBe(true);
    expect(json.options.map((row: { value: string }) => row.value)).toEqual([
      "BASIC",
      "STANDARD",
      "PREMIUM",
    ]);
  });
});
