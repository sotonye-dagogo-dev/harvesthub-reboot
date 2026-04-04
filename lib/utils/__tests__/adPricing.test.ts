import { describe, expect, it } from "vitest";
import {
    computeAdActiveUntil,
    estimateAdAmount,
    isPaymentSufficient,
    normalizeAdDuration,
} from "@/lib/utils/adPricing";

describe("ad pricing utilities", () => {
    it("estimates amount from active rates and duration", () => {
        const rateConfig = { hourlyRate: 1200, dailyRate: 8000 };

        expect(estimateAdAmount(rateConfig, "HOURLY", 3)).toBe(3600);
        expect(estimateAdAmount(rateConfig, "DAILY", 2)).toBe(16000);
    });

    it("normalizes invalid duration inputs with defaults", () => {
        expect(normalizeAdDuration("UNKNOWN", -5)).toEqual({
            durationType: "DAILY",
            durationValue: 1,
        });

        expect(normalizeAdDuration("HOURLY", 4)).toEqual({
            durationType: "HOURLY",
            durationValue: 4,
        });
    });

    it("verifies payment sufficiency against expected amount", () => {
        expect(isPaymentSufficient(10000, 10000)).toBe(true);
        expect(isPaymentSufficient(10000.00001, 10000)).toBe(true);
        expect(isPaymentSufficient(9999.99, 10000)).toBe(false);
    });

    it("computes active-until timeline from duration", () => {
        const start = new Date("2026-04-01T10:00:00.000Z");

        const hourly = computeAdActiveUntil(start, "HOURLY", 6);
        expect(hourly.toISOString()).toBe("2026-04-01T16:00:00.000Z");

        const daily = computeAdActiveUntil(start, "DAILY", 3);
        expect(daily.toISOString()).toBe("2026-04-04T10:00:00.000Z");
    });
});
