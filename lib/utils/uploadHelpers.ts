/**
 * Client-side helpers for the upload lifecycle.
 *
 * `deleteUploadedAsset` mirrors the owner-scoped `DELETE /api/upload` contract so that
 * replacing or removing a previously uploaded file removes the old Cloudinary asset instead of
 * leaving it orphaned. Deletions are scoped server-side to the requester's own upload folder
 * (guest uploads are scoped to `guest-<guestUploadId>`).
 */

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
