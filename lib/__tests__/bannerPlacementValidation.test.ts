import { describe, expect, it } from "vitest";
import { validateBannerPlacementRatio } from "@/lib/utils/bannerPlacementValidation";

describe("validateBannerPlacementRatio", () => {
    it("returns match when dimensions are missing", () => {
        expect(
            validateBannerPlacementRatio({
                placement: "TOP",
            })
        ).toEqual({ isMatch: true, warning: null });
    });

    it("returns match when uploaded ratio is within tolerance", () => {
        const result = validateBannerPlacementRatio({
            placement: "HERO",
            width: 1600,
            height: 640,
        });

        expect(result.isMatch).toBe(true);
        expect(result.warning).toBeNull();
    });

    it("returns warning when uploaded ratio deviates beyond tolerance", () => {
        const result = validateBannerPlacementRatio({
            placement: "TOP",
            width: 1000,
            height: 1000,
        });

        expect(result.isMatch).toBe(false);
        if (!result.isMatch) {
            expect(result.warning).toMatchObject({
                placement: "TOP",
                expectedRatio: "6.4:1",
            });
            expect(result.warning.deviationPercent).toBeGreaterThan(8);
            expect(result.warning.message).toContain("TOP placement works best");
        }
    });
});
