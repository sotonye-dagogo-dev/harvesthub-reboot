import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// ============================================================================
// Cloudinary Configuration
// ============================================================================

const ROOT_FOLDER = process.env.CLOUDINARY_ROOT_FOLDER || 'myharvesthub';

let configured = false;

function ensureConfigured(): void {
    if (configured) return;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
            'Missing Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)'
        );
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    configured = true;
}

// ============================================================================
// Upload presets / folder structure
// ============================================================================

type ImageCategory = 'products' | 'vendors' | 'banners' | 'profiles' | 'proofs' | 'bugs';

function folderFor(category: ImageCategory, subId?: string): string {
    const base = `${ROOT_FOLDER}/${category}`;
    return subId ? `${base}/${subId}` : base;
}

// ============================================================================
// Upload
// ============================================================================

export interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
}

/**
 * Upload an image to Cloudinary.
 * Accepts a base64 data URI, URL, or file path.
 */
export async function uploadImage(
    source: string,
    category: ImageCategory,
    subId?: string
): Promise<UploadResult> {
    ensureConfigured();

    const result: UploadApiResponse = await cloudinary.uploader.upload(source, {
        folder: folderFor(category, subId),
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
    };
}

/**
 * Delete an image by its public ID.
 * Returns true if the image existed and was deleted.
 */
export async function deleteImage(publicId: string): Promise<boolean> {
    ensureConfigured();
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
}

/**
 * Safe image replacement: upload new, update DB reference, then delete old.
 *
 * @param newSource - The new image source (base64, URL, or path)
 * @param category - Image category folder
 * @param oldPublicId - Public ID of the image being replaced (null if first upload)
 * @param updateDbFn - Async callback to update the database with the new URL/publicId.
 *                     If this throws, the newly uploaded image is cleaned up.
 * @param subId - Optional subfolder (e.g. vendor ID)
 */
export async function replaceImage(
    newSource: string,
    category: ImageCategory,
    oldPublicId: string | null,
    updateDbFn: (result: UploadResult) => Promise<void>,
    subId?: string
): Promise<UploadResult> {
    // 1. Upload new image
    const newResult = await uploadImage(newSource, category, subId);

    try {
        // 2. Update database reference
        await updateDbFn(newResult);
    } catch (dbError) {
        // DB update failed — clean up newly uploaded image
        await deleteImage(newResult.publicId).catch(() => {
            // Swallow cleanup errors; the orphan can be handled later
        });
        throw dbError;
    }

    // 3. Delete old image only after DB update succeeded
    if (oldPublicId) {
        await deleteImage(oldPublicId).catch(() => {
            // Old image cleanup failure is non-critical; log and continue
            console.warn(`Failed to delete old image: ${oldPublicId}`);
        });
    }

    return newResult;
}

/**
 * Generate an optimised Cloudinary URL with transformations.
 */
export function optimisedUrl(
    publicId: string,
    options: { width?: number; height?: number; crop?: string } = {}
): string {
    ensureConfigured();
    return cloudinary.url(publicId, {
        secure: true,
        transformation: [
            {
                width: options.width,
                height: options.height,
                crop: options.crop || 'fill',
                quality: 'auto',
                fetch_format: 'auto',
            },
        ],
    });
}
