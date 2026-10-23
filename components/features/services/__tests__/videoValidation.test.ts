import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readVideoDurationSeconds,
  validateServiceVideoFile,
  validateServiceVideoSync,
} from "../videoValidation";
import { MAX_UPLOAD_SIZE_MB } from "@/lib/utils/uploadConfig";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";

const VIDEO_MB = 1024 * 1024;

function mp4File(): File {
  return new File(["clip"], "promo.mp4", { type: "video/mp4" });
}

function stubVideoMetadata(duration: number | "error") {
  (URL as unknown as Record<string, unknown>).createObjectURL = vi.fn(
    () => "blob:service-promo",
  );
  (URL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn();

  document.createElement = ((tag: string, options?: ElementCreationOptions) => {
    if (tag !== "video") {
      return originalCreateElement.call(document, tag, options);
    }

    const video: Record<string, unknown> = {
      preload: "",
      duration: duration === "error" ? Number.NaN : duration,
      onloadedmetadata: null,
      onerror: null,
    };
    Object.defineProperty(video, "src", {
      set() {
        queueMicrotask(() => {
          if (duration === "error") {
            (video.onerror as (() => void) | null)?.();
          } else {
            (video.onloadedmetadata as (() => void) | null)?.();
          }
        });
      },
    });
    return video as unknown as HTMLVideoElement;
  }) as typeof document.createElement;
}

let originalCreateElement: typeof document.createElement;

beforeEach(() => {
  originalCreateElement = document.createElement;
});

afterEach(() => {
  document.createElement = originalCreateElement;
  delete (URL as unknown as Record<string, unknown>).createObjectURL;
  delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
  vi.restoreAllMocks();
});

describe("validateServiceVideoSync", () => {
  it("rejects anything that is not an MP4", () => {
    expect(
      validateServiceVideoSync({ name: "promo.mov", type: "video/quicktime", size: 10 }),
    ).toBe("Promo video must be an MP4 file");
  });

  it("rejects a video above the service-video cap", () => {
    const oversize = MAX_UPLOAD_SIZE_MB["service-video"] * VIDEO_MB + 1;

    expect(
      validateServiceVideoSync({ name: "promo.mp4", type: "video/mp4", size: oversize }),
    ).toBe(`Promo video must be at most ${MAX_UPLOAD_SIZE_MB["service-video"]}MB`);
  });

  it("accepts a small MP4", () => {
    expect(
      validateServiceVideoSync({ name: "promo.mp4", type: "video/mp4", size: VIDEO_MB }),
    ).toBeNull();
  });
});

describe("readVideoDurationSeconds", () => {
  it("resolves the duration from video metadata", async () => {
    stubVideoMetadata(42.5);

    await expect(readVideoDurationSeconds(mp4File())).resolves.toBe(42.5);
  });

  it("resolves null when the browser cannot decode the clip", async () => {
    stubVideoMetadata("error");

    await expect(readVideoDurationSeconds(mp4File())).resolves.toBeNull();
  });

  it("resolves null when object URLs are unavailable", async () => {
    await expect(readVideoDurationSeconds(mp4File())).resolves.toBeNull();
  });
});

describe("validateServiceVideoFile (60s PRD guard)", () => {
  it("rejects a clip longer than the limit before it is uploaded", async () => {
    stubVideoMetadata(90);

    await expect(validateServiceVideoFile(mp4File())).resolves.toContain(
      `at most ${SERVICE_LIMITS.maxVideoSeconds} seconds (this one is 90s)`,
    );
  });

  it("rejects a clip that only just crosses the limit", async () => {
    stubVideoMetadata(SERVICE_LIMITS.maxVideoSeconds + 1);

    await expect(validateServiceVideoFile(mp4File())).resolves.toContain(
      "Promo video must be at most 60 seconds",
    );
  });

  it("accepts a clip sitting on the limit", async () => {
    stubVideoMetadata(SERVICE_LIMITS.maxVideoSeconds);

    await expect(validateServiceVideoFile(mp4File())).resolves.toBeNull();
  });

  it("accepts a clip inside the rounding tolerance", async () => {
    stubVideoMetadata(SERVICE_LIMITS.maxVideoSeconds + 0.4);

    await expect(validateServiceVideoFile(mp4File())).resolves.toBeNull();
  });

  it("fails closed when the duration cannot be read", async () => {
    stubVideoMetadata("error");

    await expect(validateServiceVideoFile(mp4File())).resolves.toContain(
      "Could not read the video duration",
    );
  });

  it("surfaces the format gate without touching video metadata", async () => {
    const createObjectURL = vi.fn(() => "blob:service-promo");
    (URL as unknown as Record<string, unknown>).createObjectURL = createObjectURL;

    await expect(
      validateServiceVideoFile(new File(["x"], "promo.avi", { type: "video/x-msvideo" })),
    ).resolves.toBe("Promo video must be an MP4 file");
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
