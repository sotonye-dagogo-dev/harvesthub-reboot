import { NextRequest } from 'next/server';
import {
    uploadImage,
    getProductFolder,
    getVendorLogoFolder,
    getVendorBannerFolder,
    getProfileFolder,
    getBannerFolder,
    getAdFolder,
    getPaymentProofFolder,
    getVerificationDocFolder,
    getBugReportFolder,
} from '@/lib/services/cloudinary';
import { UserRole } from '@/lib/constants';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

type FolderType =
    | 'product'
    | 'vendor-logo'
    | 'vendor-banner'
    | 'profile'
    | 'banner'
    | 'ad'
    | 'payment-proof'
    | 'verification-doc'
    | 'bug-report';

const VALID_FOLDER_TYPES: FolderType[] = [
    'product',
    'vendor-logo',
    'vendor-banner',
    'profile',
    'banner',
    'ad',
    'payment-proof',
    'verification-doc',
    'bug-report',
];

/** Maximum upload sizes in MB per folder type */
const MAX_SIZE_MB: Record<FolderType, number> = {
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

function resolveFolder(
    folderType: FolderType,
    vendorId?: string,
    userId?: string
): string | null {
    switch (folderType) {
        case 'product':
            return vendorId ? getProductFolder(vendorId) : null;
        case 'vendor-logo':
            return vendorId ? getVendorLogoFolder(vendorId) : null;
        case 'vendor-banner':
            return vendorId ? getVendorBannerFolder(vendorId) : null;
        case 'profile':
            return userId ? getProfileFolder(userId) : null;
        case 'banner':
            return getBannerFolder();
        case 'ad':
            return userId ? getAdFolder(userId) : null;
        case 'payment-proof':
            return userId ? getPaymentProofFolder(userId) : null;
        case 'verification-doc':
            return userId ? getVerificationDocFolder(userId) : null;
        case 'bug-report':
            return userId ? getBugReportFolder(userId) : null;
        default:
            return null;
    }
}

// POST /api/upload — Authenticated image upload
export async function POST(request: NextRequest) {
    return withApiHandler('POST /api/upload', async () => {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folderType = formData.get('folderType') as FolderType | null;
        const vendorId = (formData.get('vendorId') as string) || undefined;
        const userId = (formData.get('userId') as string) || undefined;
        const rawGuestUploadId = (formData.get('guestUploadId') as string) || '';
        const skipPersistence = String(formData.get('skipPersistence') || 'false') === 'true';

        if (!file || !(file instanceof File)) {
            return apiError('No file provided', 400);
        }

        if (!folderType || !VALID_FOLDER_TYPES.includes(folderType)) {
            return apiError(
                `Invalid folderType. Must be one of: ${VALID_FOLDER_TYPES.join(', ')}`,
                400
            );
        }

        const allowGuestUpload = folderType === 'ad' || folderType === 'payment-proof' || folderType === 'bug-report';

        // ── Auth ──────────────────────────────────────────────────────
        const { cookies } = await import('next/headers');
        const { verifyToken } = await import('@/lib/utils/auth');

        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        const payload = token ? await verifyToken(token) : null;

        if (!payload && !allowGuestUpload) {
            return apiError('Unauthorized', 401);
        }

        if (payload) {
            const rl = await rateLimitByUser(payload.userId);
            if (!rl.success) return getRateLimitResponse(rl);
        } else {
            const rl = await rateLimitByIP(request, { limit: 20, window: 60 });
            if (!rl.success) return getRateLimitResponse(rl);
        }

        // ── Role-based validation ────────────────────────────────────
        if (folderType === 'banner' && payload?.role !== UserRole.ADMIN) {
            return apiError('Only admins can upload banners', 403);
        }

        if (
            ['product', 'vendor-logo', 'vendor-banner', 'verification-doc'].includes(folderType) &&
            payload?.role !== UserRole.VENDOR &&
            payload?.role !== UserRole.ADMIN
        ) {
            return apiError('Only vendors or admins can upload vendor images', 403);
        }

        const normalizedGuestUploadId = rawGuestUploadId
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .slice(0, 48);

        // Fall back to a deterministic guest bucket for unauthenticated ad-related uploads.
        const effectiveUserId =
            userId ||
            payload?.userId ||
            (normalizedGuestUploadId ? `guest-${normalizedGuestUploadId}` : 'guest-public');

        const folder = resolveFolder(folderType, vendorId, effectiveUserId);
        if (!folder) {
            return apiError(
                'Cannot resolve upload folder. Ensure vendorId or userId is provided for this folderType.',
                400
            );
        }

        // ── Convert File to base64 data URI ──────────────────────────
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/png';
        const dataUri = `data:${mimeType};base64,${base64}`;

        // ── Upload ───────────────────────────────────────────────────
        const maxSizeMB = MAX_SIZE_MB[folderType];
        const result = await uploadImage(dataUri, folder, { maxSizeMB });

        // Persist metadata to Prisma only for authenticated + opted-in flows.
        const { persistUploadMetadata, getCacheBustedUrl } = await import('@/lib/services/asset');

        let persisted: { savedTo?: string; id?: string; error?: string } = { savedTo: 'none' };
        if (!skipPersistence && payload) {
            try {
                persisted = await persistUploadMetadata({
                    folderType,
                    vendorId,
                    userId,
                    effectiveUserId,
                    url: result.url,
                    publicId: result.publicId,
                    payloadRole: payload.role,
                    orderId: (formData.get('orderId') as string) || undefined,
                    amount: ((formData.get('amount') as string) ? Number(formData.get('amount')) : 0) || undefined,
                });
            } catch (error) {
                persisted = {
                    savedTo: 'none',
                    error: error instanceof Error ? error.message : 'Unknown persistence error',
                };
            }
        }

        const cacheBustedUrl = getCacheBustedUrl(result.url);

        return apiSuccess(
            {
                url: result.url,
                cacheBustedUrl,
                publicId: result.publicId,
                width: result.width,
                height: result.height,
                format: result.format,
                persisted,
                guestUpload: !payload,
            },
            201
        );
    });
}
