import { AD_BANNER_DIMENSIONS } from "@/lib/constants";

export type BannerPlacement = "TOP" | "HERO" | "SIDEBAR";

export type BannerPlacementWarning = {
    placement: BannerPlacement;
    expectedRatio: string;
    actualRatio: string;
    deviationPercent: number;
    message: string;
};

type ValidationInput = {
    placement: BannerPlacement;
    width?: number;
    height?: number;
    tolerancePercent?: number;
};

type ValidationResult =
    | { isMatch: true; warning: null }
    | { isMatch: false; warning: BannerPlacementWarning };

const DEFAULT_TOLERANCE_PERCENT = 8;

const placementKeyMap: Record<BannerPlacement, keyof typeof AD_BANNER_DIMENSIONS> = {
    TOP: "topBanner",
    HERO: "heroBanner",
    SIDEBAR: "sidebarBanner",
};

function formatRatio(value: number) {
    return `${value.toFixed(2)}:1`;
}

export function validateBannerPlacementRatio({
    placement,
    width,
    height,
    tolerancePercent = DEFAULT_TOLERANCE_PERCENT,
}: ValidationInput): ValidationResult {
    if (!width || !height || width <= 0 || height <= 0) {
        return { isMatch: true, warning: null };
    }

    const placementConfig = AD_BANNER_DIMENSIONS[placementKeyMap[placement]];
    const targetRatio =
        placementConfig.recommended.width / placementConfig.recommended.height;
    const actualRatio = width / height;
    const ratioDelta = Math.abs(actualRatio - targetRatio);
    const deviationPercent = (ratioDelta / targetRatio) * 100;

    if (deviationPercent <= tolerancePercent) {
        return { isMatch: true, warning: null };
    }

    const warning: BannerPlacementWarning = {
        placement,
        expectedRatio: placementConfig.recommended.ratio,
        actualRatio: formatRatio(actualRatio),
        deviationPercent: Number(deviationPercent.toFixed(1)),
        message:
            `${placement} placement works best at ${placementConfig.recommended.width}x${placementConfig.recommended.height} ` +
            `(${placementConfig.recommended.ratio}). Uploaded image is ${width}x${height} (${formatRatio(actualRatio)}), ` +
            `which may crop or letterbox in this slot.`,
    };

    return { isMatch: false, warning };
}
