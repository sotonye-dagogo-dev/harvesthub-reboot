import { describe, expect, it } from "vitest";
import {
  aggregateBannerAnalytics,
  computeBannerMetrics,
  isBannerEventType,
  type BannerAnalyticsEvent,
} from "@/lib/analytics/bannerAnalytics";

function event(
  bannerId: string,
  type: BannerAnalyticsEvent["type"],
  overrides: Partial<BannerAnalyticsEvent> = {}
): BannerAnalyticsEvent {
  return { bannerId, type, userId: null, visitorId: null, ...overrides };
}

describe("isBannerEventType", () => {
  it("accepts known event kinds and rejects unknown values", () => {
    expect(isBannerEventType("IMPRESSION")).toBe(true);
    expect(isBannerEventType("CLICK")).toBe(true);
    expect(isBannerEventType("CONVERSION")).toBe(true);
    expect(isBannerEventType("VIEW")).toBe(false);
    expect(isBannerEventType(null)).toBe(false);
    expect(isBannerEventType(undefined)).toBe(false);
  });
});

describe("computeBannerMetrics", () => {
  it("returns zeroed metrics for an empty event list", () => {
    const metrics = computeBannerMetrics([]);
    expect(metrics).toEqual({
      impressions: 0,
      uniqueImpressions: 0,
      authenticatedImpressions: 0,
      anonymousImpressions: 0,
      clicks: 0,
      uniqueClicks: 0,
      authenticatedClicks: 0,
      anonymousClicks: 0,
      conversions: 0,
      uniqueConversions: 0,
      authenticatedConversions: 0,
      anonymousConversions: 0,
      clickThroughRate: 0,
      conversionRate: 0,
    });
  });

  it("counts totals, unique, authenticated, and anonymous splits", () => {
    const metrics = computeBannerMetrics([
      event("b1", "IMPRESSION", { visitorId: "v1" }),
      event("b1", "IMPRESSION", { visitorId: "v1" }),
      event("b1", "IMPRESSION", { visitorId: "v2" }),
      event("b1", "IMPRESSION", { userId: "u1", visitorId: "v3" }),
      event("b1", "CLICK", { visitorId: "v1" }),
      event("b1", "CLICK", { userId: "u1", visitorId: "v3" }),
      event("b1", "CONVERSION", { userId: "u1", visitorId: "v3" }),
    ]);

    expect(metrics.impressions).toBe(4);
    expect(metrics.uniqueImpressions).toBe(3); // v1, v2, u1
    expect(metrics.authenticatedImpressions).toBe(1); // u1
    expect(metrics.anonymousImpressions).toBe(3); // v1, v1, v2

    expect(metrics.clicks).toBe(2);
    expect(metrics.uniqueClicks).toBe(2); // v1, u1
    expect(metrics.authenticatedClicks).toBe(1);
    expect(metrics.anonymousClicks).toBe(1);

    expect(metrics.conversions).toBe(1);
    expect(metrics.uniqueConversions).toBe(1);
    expect(metrics.authenticatedConversions).toBe(1);
    expect(metrics.anonymousConversions).toBe(0);

    expect(metrics.clickThroughRate).toBe(0.5);
    expect(metrics.conversionRate).toBe(0.5);
  });

  it("does not double-count an authenticated visitor when visitorId is also present", () => {
    const metrics = computeBannerMetrics([
      event("b1", "IMPRESSION", { userId: "u1", visitorId: "v1" }),
      event("b1", "IMPRESSION", { userId: "u1", visitorId: "v2" }),
      event("b1", "IMPRESSION", { userId: "u1", visitorId: "v3" }),
    ]);

    expect(metrics.uniqueImpressions).toBe(1);
    expect(metrics.authenticatedImpressions).toBe(3);
  });

  it("treats events without any identity as individually unique", () => {
    const metrics = computeBannerMetrics([
      event("b1", "IMPRESSION"),
      event("b1", "IMPRESSION"),
    ]);

    expect(metrics.impressions).toBe(2);
    expect(metrics.uniqueImpressions).toBe(2);
    expect(metrics.anonymousImpressions).toBe(2);
  });

  it("guards division by zero for rates", () => {
    const metrics = computeBannerMetrics([
      event("b1", "IMPRESSION", { visitorId: "v1" }),
    ]);
    expect(metrics.clickThroughRate).toBe(0);
    expect(metrics.conversionRate).toBe(0);
  });
});

describe("aggregateBannerAnalytics", () => {
  it("groups events by banner and produces an overall summary", () => {
    const result = aggregateBannerAnalytics([
      event("b1", "IMPRESSION", { visitorId: "v1" }),
      event("b1", "IMPRESSION", { visitorId: "v2" }),
      event("b1", "CLICK", { visitorId: "v1" }),
      event("b2", "IMPRESSION", { visitorId: "v1" }),
    ]);

    expect(result.summary.impressions).toBe(3);
    expect(result.summary.uniqueImpressions).toBe(2);
    expect(result.summary.clicks).toBe(1);

    expect(result.byBanner).toHaveLength(2);
    const b1 = result.byBanner.find((row) => row.bannerId === "b1");
    const b2 = result.byBanner.find((row) => row.bannerId === "b2");

    expect(b1?.impressions).toBe(2);
    expect(b1?.clicks).toBe(1);
    expect(b1?.clickThroughRate).toBe(0.5);
    expect(b2?.impressions).toBe(1);
    expect(b2?.clicks).toBe(0);
  });
});
