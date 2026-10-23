/**
 * Client-side validation for the service listing promo video.
 *
 * The server cannot verify a video's duration (no ffmpeg on the runtime), so
 * the 60-second rule from the PRD is enforced here *before* the file is
 * uploaded — size and format are double-checked server-side by the upload
 * route's folder config.
 */

import { MAX_UPLOAD_SIZE_MB } from '@/lib/utils/uploadConfig';
import { SERVICE_LIMITS } from '@/lib/config/serviceFulfillment';

const BYTES_PER_MB = 1024 * 1024;
const METADATA_TIMEOUT_MS = 5000;

/** Format + size gate (synchronous, safe to run before any network call). */
export function validateServiceVideoSync(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
    const extension = (file.name.split('.').pop() ?? '').toLowerCase();
    if (extension !== 'mp4' && file.type !== 'video/mp4') {
        return 'Promo video must be an MP4 file';
    }

    const maxMb = MAX_UPLOAD_SIZE_MB['service-video'];
    if (file.size > maxMb * BYTES_PER_MB) {
        return `Promo video must be at most ${maxMb}MB`;
    }

    return null;
}

/**
 * Reads a video's duration in seconds via `HTMLVideoElement`. Resolves `null`
 * when the browser cannot read the metadata (unsupported codec, jsdom, etc.)
 * instead of throwing, so the caller can surface a friendly message.
 */
export function readVideoDurationSeconds(file: Blob): Promise<number | null> {
    return new Promise((resolve) => {
        let settled = false;
        let timer: number | undefined;
        const finish = (value: number | null) => {
            if (settled) return;
            settled = true;
            if (timer !== undefined) window.clearTimeout(timer);
            resolve(value);
        };

        try {
            if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
                finish(null);
                return;
            }

            const url = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.preload = 'metadata';

            const cleanup = () => {
                try {
                    URL.revokeObjectURL(url);
                } catch {
                    // Ignore revoke failures — the object URL is best-effort.
                }
            };

            video.onloadedmetadata = () => {
                const duration = video.duration;
                finish(Number.isFinite(duration) ? duration : null);
                cleanup();
            };
            video.onerror = () => {
                finish(null);
                cleanup();
            };
            timer = window.setTimeout(() => {
                finish(null);
                cleanup();
            }, METADATA_TIMEOUT_MS);

            video.src = url;
        } catch {
            finish(null);
        }
    });
}

/**
 * Full pre-upload check: format, size, then duration
 * (`SERVICE_LIMITS.maxVideoSeconds`). Returns an error message or `null`.
 */
export async function validateServiceVideoFile(file: File): Promise<string | null> {
    const syncIssue = validateServiceVideoSync(file);
    if (syncIssue) return syncIssue;

    const duration = await readVideoDurationSeconds(file);
    if (duration === null) {
        return 'Could not read the video duration — re-export the clip as MP4 and try again';
    }
    if (duration > SERVICE_LIMITS.maxVideoSeconds + 0.5) {
        const seconds = Math.round(duration);
        return `Promo video must be at most ${SERVICE_LIMITS.maxVideoSeconds} seconds (this one is ${seconds}s)`;
    }

    return null;
}
