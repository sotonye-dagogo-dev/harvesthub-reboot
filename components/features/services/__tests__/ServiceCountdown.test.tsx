import { describe, expect, it } from "vitest";
import {
  countdownTone,
  formatRemaining,
  COUNTDOWN_TONE_LABEL,
} from "@/components/features/services/ServiceCountdown";

const WARNING_HOURS = 12;

describe("countdownTone thresholds", () => {
  it("returns none when there is no deadline", () => {
    expect(countdownTone(undefined)).toBe("none");
    expect(countdownTone(null)).toBe("none");
    expect(countdownTone(Number.NaN)).toBe("none");
  });

  it("returns overdue for negative remaining time", () => {
    expect(countdownTone(-0.01)).toBe("overdue");
    expect(countdownTone(-72)).toBe("overdue");
  });

  it("returns error strictly below the warning threshold", () => {
    expect(countdownTone(0, WARNING_HOURS)).toBe("error");
    expect(countdownTone(11.99, WARNING_HOURS)).toBe("error");
  });

  it("returns warning at and up to twice the threshold", () => {
    expect(countdownTone(WARNING_HOURS, WARNING_HOURS)).toBe("warning");
    expect(countdownTone(23.99, WARNING_HOURS)).toBe("warning");
  });

  it("returns ok once comfortably above the threshold", () => {
    expect(countdownTone(WARNING_HOURS * 2, WARNING_HOURS)).toBe("ok");
    expect(countdownTone(240, WARNING_HOURS)).toBe("ok");
  });

  it("uses the configured default threshold (12h)", () => {
    expect(countdownTone(11)).toBe("error");
    expect(countdownTone(13)).toBe("warning");
  });

  it("always has a text label for every tone", () => {
    const tones = ["overdue", "error", "warning", "ok", "none"] as const;
    for (const tone of tones) {
      expect(COUNTDOWN_TONE_LABEL[tone].length).toBeGreaterThan(0);
    }
  });
});

describe("formatRemaining", () => {
  it("formats days, hours and minutes with units", () => {
    expect(formatRemaining(50)).toBe("2d 2h");
    expect(formatRemaining(2.5)).toBe("2h 30m");
    expect(formatRemaining(0.5)).toBe("30m");
  });

  it("never renders a bare number", () => {
    expect(formatRemaining(0)).toMatch(/[dhm]/);
  });
});
