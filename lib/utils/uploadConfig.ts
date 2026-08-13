/**
 * Shared upload contract for the `/api/upload` pipeline and every client that
 * talks to it. Keeping the folder-type limits and accepted formats in one place
 * guarantees the client-side validation copy and the server-side enforcement can
 * never drift apart (a file the UI advertises must always be accepted upstream).
 */

export type FolderType =
    | 'product'
    | 'vendor-logo'
    | 'vendor-banner'
    | 'profile'
    | 'banner'
    | 'ad'
    | 'payment-proof'
    | 'verification-doc'
    | 'bug-report';

export const IMAGE_UPLOAD_FORMATS = ['jpeg', 'jpg', 'png', 'webp'] as const;
export const DOCUMENT_UPLOAD_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'pdf'] as const;

/** Maximum upload sizes in MB per folder type. */
export const MAX_UPLOAD_SIZE_MB: Record<FolderType, number> = {
    product: 5,
    'vendor-logo': 2,
    'vendor-banner': 10,
    profile: 2,
    banner: 10,
    ad: 10,
    'payment-proof': 5,
    'verification-doc': 5,
    'bug-report': 5,
};

/**
 * Formats accepted per folder type. Image-only folders stay image-only; document
 * folders (verification docs, payment proof, bug reports) also accept PDFs so a
 * certificate or receipt does not need to be converted to an image before upload.
 */
export const ALLOWED_UPLOAD_FORMATS: Record<FolderType, readonly string[]> = {
    product: IMAGE_UPLOAD_FORMATS,
    'vendor-logo': IMAGE_UPLOAD_FORMATS,
    'vendor-banner': IMAGE_UPLOAD_FORMATS,
    profile: IMAGE_UPLOAD_FORMATS,
    banner: IMAGE_UPLOAD_FORMATS,
    ad: IMAGE_UPLOAD_FORMATS,
    'payment-proof': DOCUMENT_UPLOAD_FORMATS,
    'verification-doc': DOCUMENT_UPLOAD_FORMATS,
    'bug-report': DOCUMENT_UPLOAD_FORMATS,
};

/** Accept attribute string for `<input type="file">` used by the image uploader. */
export function acceptAttributeFor(folderType: FolderType): string {
    const formats = ALLOWED_UPLOAD_FORMATS[folderType];
    return formats.map((format) => `.${format}`).join(',');
}