/**
 * Client-side helpers for the upload lifecycle.
 *
 * `deleteUploadedAsset` mirrors the owner-scoped `DELETE /api/upload` contract so that
 * replacing or removing a previously uploaded file removes the old Cloudinary asset instead of
 * leaving it orphaned. Deletions are scoped server-side to the requester's own upload folder
 * (guest uploads are scoped to `guest-<guestUploadId>`).
 *
 * `getUploadErrorMessage` turns raw upload failures (client validation, server 4xx bodies, or
 * network errors) into concise, user-facing copy so a failed upload never shows a vague
 * "Upload failed" without explaining why.
 */

const FORMAT_DISPLAY: Record<string, string> = { jpeg: 'JPG', jpg: 'JPG' };

function formatAllowedFormats(formats?: string[]): string {
    if (!formats || formats.length === 0) return 'the supported formats';
    const parts = formats.map((format) => FORMAT_DISPLAY[format.toLowerCase()] ?? format.toUpperCase());
    if (parts.length === 1) return parts[0] as string;
    return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`;
}

export interface UploadErrorMessageOptions {
    /** Copy used when no specific reason can be determined. */
    fallback?: string;
    /** Show a precise "max XMB" hint when the failure is a size limit. */
    maxSizeMB?: number;
    /** Human-read labels for the accepted formats (e.g. ['jpeg', 'png', 'pdf']). */
    allowedFormats?: string[];
}

export function getUploadErrorMessage(
    error: unknown,
    options: UploadErrorMessageOptions = {}
): string {
    const fallback = options.fallback || 'Upload failed. Please try again.';
    if (!(error instanceof Error) || !error.message) return fallback;

    const raw = error.message;
    const lower = raw.toLowerCase();

    if (
        lower.includes('too large') ||
        lower.includes('exceeds') ||
        lower.includes('maximum size') ||
        lower.includes('file size')
    ) {
        return options.maxSizeMB
            ? `File is too large (max ${options.maxSizeMB}MB).`
            : 'File is too large. Please upload a smaller file.';
    }

    if (
        lower.includes('not allowed') ||
        lower.includes('accepted formats') ||
        lower.includes('unsupported') ||
        lower.includes('invalid file')
    ) {
        return options.allowedFormats && options.allowedFormats.length > 0
            ? `Unsupported file type. Use ${formatAllowedFormats(options.allowedFormats)}.`
            : 'Unsupported file type.';
    }

    if (
        lower.includes('failed to fetch') ||
        lower.includes('failed to load') ||
        lower.includes('net::') ||
        lower.includes('network') ||
        lower.includes('no response') ||
        lower.includes('no-response')
    ) {
        return 'Network error. Please check your connection and try again.';
    }

    if (lower.includes('unauthorized')) {
        return 'Upload failed. Please sign in again and retry.';
    }

    if (lower.includes('forbidden') || lower.includes('not belong to this upload scope')) {
        return 'You are not allowed to modify that file.';
    }

    if (lower.includes('too many requests') || lower.includes('rate limit')) {
        return 'Too many uploads right now. Please wait a moment and try again.';
    }

    // The server already returned a concise, specific message — pass it through so the
    // user sees the real reason instead of a generic failure.
    if (raw.length <= 200 && !lower.includes('exception') && !lower.includes('stack')) {
        return raw;
    }

    return fallback;
}

export interface DeleteUploadedAssetOptions {
    publicId: string;
    folderType: string;
    userId?: string;
    guestUploadId?: string;
}

export interface DeleteUploadedAssetResult {
    ok: boolean;
    error?: string;
}

export async function deleteUploadedAsset({
    publicId,
    folderType,
    userId,
    guestUploadId,
}: DeleteUploadedAssetOptions): Promise<DeleteUploadedAssetResult> {
    try {
        const params = new URLSearchParams({ publicId, folderType });
        if (userId) params.set('userId', userId);
        if (guestUploadId) params.set('guestUploadId', guestUploadId);

        const response = await fetch(`/api/upload?${params.toString()}`, { method: 'DELETE' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            return { ok: false, error: payload?.error || 'Failed to delete asset' };
        }
        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Failed to delete asset',
        };
    }
}
