export type AdDurationType = "HOURLY" | "DAILY";

export interface AdRateConfigLike {
    hourlyRate: number;
    dailyRate: number;
}

export const FALLBACK_AD_RATE_CONFIG: AdRateConfigLike = {
    hourlyRate: 0,
    dailyRate: 0,
};

export interface NormalizedAdDuration {
    durationType: AdDurationType;
    durationValue: number;
}

function toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const rounded = Math.trunc(parsed);
    return rounded > 0 ? rounded : fallback;
}

export function normalizeAdDuration(
    durationType: unknown,
    durationValue: unknown,
    fallbackType: AdDurationType = "DAILY",
    fallbackValue = 1
): NormalizedAdDuration {
    const normalizedType = durationType === "HOURLY" || durationType === "DAILY"
        ? durationType
        : fallbackType;

    return {
        durationType: normalizedType,
        durationValue: toPositiveInt(durationValue, fallbackValue),
    };
}

export function estimateAdAmount(
    rateConfig: AdRateConfigLike,
    durationType: AdDurationType,
    durationValue: number
): number {
    const unitRate = durationType === "HOURLY" ? rateConfig.hourlyRate : rateConfig.dailyRate;
    const estimate = unitRate * durationValue;
    return Math.round(estimate * 100) / 100;
}

export function isPaymentSufficient(amountPaid: number, expectedAmount: number): boolean {
    const normalizedPaid = Number.isFinite(amountPaid) ? amountPaid : 0;
    return normalizedPaid + 0.0001 >= expectedAmount;
}

function toNonNegativeNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed >= 0 ? parsed : fallback;
}

export function resolveAdRateConfig(rateConfig: AdRateConfigLike | null | undefined): {
    rateConfig: AdRateConfigLike;
    usedFallback: boolean;
} {
    if (!rateConfig) {
        return { rateConfig: FALLBACK_AD_RATE_CONFIG, usedFallback: true };
    }

    return {
        rateConfig: {
            hourlyRate: toNonNegativeNumber(rateConfig.hourlyRate, FALLBACK_AD_RATE_CONFIG.hourlyRate),
            dailyRate: toNonNegativeNumber(rateConfig.dailyRate, FALLBACK_AD_RATE_CONFIG.dailyRate),
        },
        usedFallback: false,
    };
}

export function computeAdActiveUntil(
    startDate: Date,
    durationType: AdDurationType,
    durationValue: number
): Date {
    const start = new Date(startDate);
    const activeUntil = new Date(start.getTime());

    if (durationType === "HOURLY") {
        activeUntil.setHours(activeUntil.getHours() + durationValue);
    } else {
        activeUntil.setDate(activeUntil.getDate() + durationValue);
    }

    return activeUntil;
}
