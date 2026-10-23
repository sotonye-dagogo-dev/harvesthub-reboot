import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    optionList: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));

import {
  OptionListValidationError,
  clearOptionListCache,
  getOptionList,
  upsertOptionList,
  validateOptionListPayload,
} from "@/lib/services/optionLists";
import {
  OPTION_LIST_DEFINITIONS,
  OPTION_LIST_FALLBACKS,
  parseOptionRows,
  resolveOptionLabel,
  visibleOptions,
} from "@/lib/config/optionLists";
import { CAMPUS_LOCATIONS } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
  clearOptionListCache();
});

describe("getOptionList resilience (never throws)", () => {
  it("returns the code fallback when the DB query rejects", async () => {
    mockPrisma.optionList.findUnique.mockRejectedValue(new Error("connection refused"));

    const list = await getOptionList("campus");

    expect(list).not.toBeNull();
    expect(list?.fallback).toBe(true);
    expect(list?.options).toEqual([...OPTION_LIST_FALLBACKS.campus]);
  });

  it("returns the code fallback when no row exists", async () => {
    mockPrisma.optionList.findUnique.mockResolvedValue(null);

    const list = await getOptionList("serviceMilestones");

    expect(list?.fallback).toBe(true);
    expect(list?.options.map((row) => row.value)).toEqual(
      OPTION_LIST_FALLBACKS.serviceMilestones.map((row) => row.value),
    );
  });

  it("returns the code fallback when the stored options are empty", async () => {
    mockPrisma.optionList.findUnique.mockResolvedValue({
      key: "campus",
      options: [],
      isActive: true,
      updatedAt: new Date("2026-09-29T00:00:00Z"),
      updatedBy: "admin-1",
    });

    const list = await getOptionList("campus");

    expect(list?.fallback).toBe(true);
    expect(list?.options.length).toBeGreaterThan(0);
  });

  it("returns null for an unregistered key without touching the DB", async () => {
    const list = await getOptionList("not-a-real-list");

    expect(list).toBeNull();
    expect(mockPrisma.optionList.findUnique).not.toHaveBeenCalled();
  });

  it("drops stored values that are not legal for a DISPLAY list", async () => {
    mockPrisma.optionList.findUnique.mockResolvedValue({
      key: "listingTypes",
      options: [
        { value: "SERVICE", label: "Service" },
        { value: "INJECTED_VALUE", label: "Injected" },
      ],
      isActive: true,
      updatedAt: new Date(),
      updatedBy: null,
    });

    const list = await getOptionList("listingTypes");

    const values = (list?.options ?? []).map((row) => row.value);
    expect(values).toContain("SERVICE");
    expect(values).toContain("PRODUCT");
    expect(values).not.toContain("INJECTED_VALUE");
  });

  it("appends enum values missing from an incomplete DISPLAY row", async () => {
    mockPrisma.optionList.findUnique.mockResolvedValue({
      key: "serviceLocations",
      options: [{ value: "REMOTE", label: "Remote only" }],
      isActive: true,
      updatedAt: new Date(),
      updatedBy: null,
    });

    const list = await getOptionList("serviceLocations");
    const values = (list?.options ?? []).map((row) => row.value);

    expect(values).toEqual(["REMOTE", "ON_SITE", "BOTH"]);
    expect(list?.options[0]?.label).toBe("Remote only");
  });

  it("uses the stored row as the whole set for a FREEFORM list", async () => {
    mockPrisma.optionList.findUnique.mockResolvedValue({
      key: "serviceMilestones",
      options: [
        { value: "KICKOFF", label: "Kickoff" },
        { value: "HANDOVER", label: "Handover" },
      ],
      isActive: true,
      updatedAt: new Date(),
      updatedBy: null,
    });

    const list = await getOptionList("serviceMilestones");

    expect(list?.fallback).toBe(false);
    expect(list?.options.map((row) => row.value)).toEqual(["KICKOFF", "HANDOVER"]);
  });
});

describe("option payload validation (admin PUT)", () => {
  it("rejects a non-array payload", () => {
    expect(() => validateOptionListPayload("campus", "nope")).toThrowError(
      /OPTION_LIST_INVALID_OPTIONS|Options must be an array/,
    );
  });

  it("rejects entries that are not { value, label } objects", () => {
    expect(() => validateOptionListPayload("campus", [{ value: "LONDON" }])).toThrow(
      OptionListValidationError,
    );
  });

  it("rejects duplicate values", () => {
    expect(() =>
      validateOptionListPayload("serviceMilestones", [
        { value: "A", label: "A" },
        { value: "A", label: "A again" },
      ]),
    ).toThrowError(/Duplicate/);
  });

  it("rejects values outside the code enum for a DISPLAY list", () => {
    expect(() =>
      validateOptionListPayload("serviceLocations", [{ value: "SPACE", label: "Space" }]),
    ).toThrowError(/not a legal value/);
  });

  it("rejects payloads larger than the configured bound", () => {
    const definition = OPTION_LIST_DEFINITIONS.serviceMilestones;
    const oversized = Array.from({ length: (definition.maxOptions ?? 12) + 1 }, (_, index) => ({
      value: `M${index}`,
      label: `Milestone ${index}`,
    }));

    expect(() => validateOptionListPayload("serviceMilestones", oversized)).toThrowError(
      /at most/,
    );
  });

  it("rejects an unregistered key", () => {
    expect(() => validateOptionListPayload("nope", [])).toThrowError(/Unknown option list/);
  });

  it("persists a valid payload and invalidates the cache", async () => {
    mockPrisma.optionList.upsert.mockResolvedValue({});
    mockPrisma.optionList.findUnique.mockResolvedValue({
      key: "serviceMilestones",
      options: [
        { value: "A", label: "A" },
        { value: "B", label: "B" },
      ],
      isActive: true,
      updatedAt: new Date(),
      updatedBy: "admin-1",
    });

    const saved = await upsertOptionList(
      "serviceMilestones",
      [
        { value: "A", label: "A" },
        { value: "B", label: "B" },
      ],
      "admin-1",
    );

    expect(mockPrisma.optionList.upsert).toHaveBeenCalled();
    expect(saved.fallback).toBe(false);
    expect(saved.options.map((row) => row.value)).toEqual(["A", "B"]);
  });
});

describe("label resolution helpers", () => {
  it("returns the code label for a known value", () => {
    expect(resolveOptionLabel("campus", CAMPUS_LOCATIONS[0].value)).toBe(CAMPUS_LOCATIONS[0].label);
  });

  it("returns the raw value when no row matches (legacy data)", () => {
    expect(resolveOptionLabel("campus", "LEGACY_CAMPUS")).toBe("LEGACY_CAMPUS");
  });

  it("returns an empty string for nullish input", () => {
    expect(resolveOptionLabel("campus", null)).toBe("");
    expect(resolveOptionLabel("campus", undefined)).toBe("");
    expect(resolveOptionLabel("campus", "")).toBe("");
  });

  it("prefers an explicit option row over the fallback", () => {
    expect(
      resolveOptionLabel("campus", "LONDON", [{ value: "LONDON", label: "Greater London" }]),
    ).toBe("Greater London");
  });

  it("filters hidden rows out of pickers but keeps them resolvable", () => {
    const rows = [
      { value: "A", label: "A" },
      { value: "B", label: "B", hidden: true },
    ];

    expect(visibleOptions(rows).map((row) => row.value)).toEqual(["A"]);
    expect(resolveOptionLabel("campus", "B", rows)).toBe("B");
  });

  it("parseOptionRows rejects malformed shapes", () => {
    expect(parseOptionRows([{ value: "" , label: "x" }])).toBeNull();
    expect(parseOptionRows([{ value: "x" }])).toBeNull();
    expect(parseOptionRows("not-an-array")).toBeNull();
    expect(parseOptionRows([{ value: "x", label: "y" }])).toEqual([{ value: "x", label: "y" }]);
  });
});
