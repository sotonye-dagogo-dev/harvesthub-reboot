/**
 * Cloudinary Image Management Service for MyHarvestHub
 *
 * All images are stored under the root folder: myharvesthub/
 *
 * Safe replacement strategy:
 *   1. Upload new image
 *   2. Update database reference
 *   3. Delete old image (only after DB update succeeds)
 */

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '@/lib/config';

// ============================================================================
// Configuration
// ============================================================================

export const CLOUDINARY_ROOT_FOLDER =
    env.cloudinaryRootFolder;

let configured = false;

function ensureConfigured(): void {
    if (configured) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.warn(
            '[Cloudinary] Missing environment variables — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
        );
        throw new Error(
            'Cloudinary is not configured. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.'
        );
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
    configured = true;
}

// ============================================================================
// Folder Path Builders
// ============================================================================

export function getProductFolder(vendorId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/products/${vendorId}`;
}

export function getVendorLogoFolder(vendorId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/vendors/${vendorId}/logo`;
}

export function getVendorBannerFolder(vendorId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/vendors/${vendorId}/banner`;
}

export function getProfileFolder(userId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/profiles/${userId}`;
}

export function getBannerFolder(): string {
    return `${CLOUDINARY_ROOT_FOLDER}/banners`;
}

export function getAdFolder(userId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/ads/${userId}`;
}

export function getPaymentProofFolder(userId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/payments/${userId}`;
}

export function getVerificationDocFolder(userId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/verification-docs/${userId}`;
}

export function getBugReportFolder(userId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/bug-reports/${userId}`;
}

export function getVendorContentFolder(vendorId: string): string {
    return `${CLOUDINARY_ROOT_FOLDER}/vendor-content/${vendorId}`;
}

/**
 * True when a Cloudinary public_id belongs under the given folder scope.
 * Used to prevent deleting assets that were not uploaded by the requester.
 */
export function isAssetInFolder(publicId: string, folder: string): boolean {
    return publicId.startsWith(`${folder}/`);
}

// ============================================================================
// Types
// ============================================================================

export interface UploadResult {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format: string;
}

interface UploadOptions {
    /** Maximum file size in MB (validated against bytes after upload) */
    maxSizeMB?: number;
    /** Allowed file formats (default: jpeg, jpg, png, webp) */
    allowedFormats?: string[];
    /** Override the auto-detected Cloudinary resource type */
    resourceType?: UploadResourceType;
}

const DEFAULT_ALLOWED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
const BYTES_PER_MB = 1024 * 1024;

const DEFAULT_TRANSFORMATION = [{ quality: 'auto', fetch_format: 'auto' }];

export type UploadResourceType = 'image' | 'video' | 'raw';

export interface ResolvedUploadParams {
    mime: string | null;
    ext: string | null;
    resourceType: UploadResourceType;
    transformation: { quality: string; fetch_format: string }[] | undefined;
}

/**
 * Parse a base64 data URI and validate it against the accepted formats without
 * touching Cloudinary, so the format/resource-type logic is unit-testable.
 *
 * - `image/*` MIME types map to the Cloudinary `image` resource type.
 * - `application/pdf` also maps to `image` because Cloudinary stores PDFs as
 *   image assets (thumbnail + page transforms still work).
 * - `video/*` maps to `video`.
 * - anything else maps to `raw`.
 *
 * @throws when the data URI is malformed or its format is not in `allowedFormats`.
 */
export function resolveUploadParams(
    source: string,
    allowedFormats: string[]
): ResolvedUploadParams {
    const match = source.match(/^data:([^;,]+);base64,/);
    if (!match) {
        throw new Error(
            'Invalid file data URI. Expected format: data:<mime>;base64,...'
        );
    }

    const mime = (match[1] || '').toLowerCase();
    const ext = mime.includes('/') ? mime.split('/')[1] ?? '' : '';
    if (!ext || !allowedFormats.includes(ext)) {
        throw new Error(
            `File type "${ext || mime}" is not allowed. Accepted formats: ${allowedFormats.join(', ')}`
        );
    }

    const resourceType: UploadResourceType = mime.startsWith('image/')
        ? 'image'
        : mime === 'application/pdf'
            ? 'image'
            : mime.startsWith('video/')
                ? 'video'
                : 'raw';

    return {
        mime,
        ext,
        resourceType,
        transformation: resourceType === 'raw' ? undefined : DEFAULT_TRANSFORMATION,
    };
}

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Upload a file to Cloudinary.
 *
 * Accepts any of the formats allowed by `options.allowedFormats`. Images and PDFs
 * are stored as image resources (so thumbnails and transformations keep working),
 * videos as video resources, and other file types as raw resources.
 *
 * @param file - A base64 data URI string (`data:<mime>;base64,...`) or a Buffer
 * @param folder - The Cloudinary folder path (use the folder builders above)
 * @param options - Optional size and format constraints
 */
export async function uploadImage(
    file: string | Buffer,
    folder: string,
    options: UploadOptions = {}
): Promise<UploadResult> {
    ensureConfigured();

    const allowedFormats = options.allowedFormats ?? DEFAULT_ALLOWED_FORMATS;
    const maxSizeMB = options.maxSizeMB ?? 10;

    // Convert Buffer to a base64 data URI so the Cloudinary SDK can handle it
    const source =
        Buffer.isBuffer(file)
            ? `data:application/octet-stream;base64,${file.toString('base64')}`
            : file;

    let resourceType: UploadResourceType;
    let transformation: { quality: string; fetch_format: string }[] | undefined;

    if (typeof source === 'string' && source.startsWith('data:')) {
        const params = resolveUploadParams(source, allowedFormats);
        resourceType = options.resourceType ?? params.resourceType;
        transformation = params.transformation;
    } else {
        resourceType = options.resourceType ?? 'image';
        transformation = resourceType === 'raw' ? undefined : DEFAULT_TRANSFORMATION;
    }

    const result: UploadApiResponse = await cloudinary.uploader.upload(source, {
        folder,
        resource_type: resourceType,
        // `allowed_formats` is only a valid upload parameter for image/video resources.
        ...(resourceType === 'raw' ? {} : { allowed_formats: allowedFormats }),
        transformation,
    });

    // Validate file size after upload (Cloudinary returns bytes)
    if (result.bytes > maxSizeMB * BYTES_PER_MB) {
        // Remove the oversized upload
        await cloudinary.uploader.destroy(result.public_id).catch(() => { });
        throw new Error(
            `File size (${(result.bytes / BYTES_PER_MB).toFixed(1)}MB) exceeds the ${maxSizeMB}MB limit.`
        );
    }

    return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
    };
}

/**
 * Delete an image by its public ID.
 *
 * Safe — never throws. Returns `true` if the image was deleted, `false` on
 * any error (which is logged to the console).
 */
export async function deleteImage(publicId: string): Promise<boolean> {
    try {
        ensureConfigured();
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        console.error(`[Cloudinary] Failed to delete image "${publicId}":`, error);
        return false;
    }
}

/**
 * Replace an image with a safe two-phase strategy.
 *
 * 1. Uploads the new image.
 * 2. Returns the result **and** a `cleanupOld()` callback.
 * 3. The caller should update the database, then invoke `cleanupOld()` to
 *    remove the previous image.
 *
 * If `oldPublicId` is null or undefined, `cleanupOld` is a no-op.
 *
 * @example
 * ```ts
 * const { result, cleanupOld } = await replaceImage(file, folder, oldPublicId);
 * await db.products.update(id, { imageUrl: result.url, imagePublicId: result.publicId });
 * await cleanupOld();
 * ```
 */
export async function replaceImage(
    file: string | Buffer,
    folder: string,
    oldPublicId?: string | null,
    options?: UploadOptions
): Promise<{ result: UploadResult; cleanupOld: () => Promise<void> }> {
    const result = await uploadImage(file, folder, options);

    const cleanupOld = async (): Promise<void> => {
        if (oldPublicId) {
            const deleted = await deleteImage(oldPublicId);
            if (!deleted) {
                console.warn(
                    `[Cloudinary] Old image "${oldPublicId}" was not deleted — it may need manual cleanup.`
                );
            }
        }
    };

    return { result, cleanupOld };
}

/**
 * Delete all resources inside a Cloudinary folder.
 *
 * Intended for cleanup when a vendor, product, or user account is deleted.
 * Fire-and-forget — logs errors but never throws.
 */
export async function deleteFolder(folder: string): Promise<void> {
    try {
        ensureConfigured();
        // Delete all resources in the folder first
        await cloudinary.api.delete_resources_by_prefix(folder);
        // Then remove the (now empty) folder
        await cloudinary.api.delete_folder(folder);
    } catch (error) {
        console.error(
            `[Cloudinary] Failed to delete folder "${folder}":`,
            error
        );
    }
}
