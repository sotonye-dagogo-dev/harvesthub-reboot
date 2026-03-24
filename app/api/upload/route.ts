import { NextRequest, NextResponse } from 'next/server';
import {
    uploadImage,
    getProductFolder,
    getVendorLogoFolder,
    getVendorBannerFolder,
    getProfileFolder,
    getBannerFolder,
    getAdFolder,
    getPaymentProofFolder,
} from '@/lib/services/cloudinary';
import { UserRole } from '@/lib/constants';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

type FolderType =
    | 'product'
    | 'vendor-logo'
    | 'vendor-banner'
    | 'profile'
    | 'banner'
    | 'ad'
    | 'payment-proof';

const VALID_FOLDER_TYPES: FolderType[] = [
    'product',
    'vendor-logo',
    'vendor-banner',
    'profile',
    'banner',
    'ad',
    'payment-proof',
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
        default:
            return null;
    }
}

// POST /api/upload — Authenticated image upload
export async function POST(request: NextRequest) {
    try {
        // ── Auth ──────────────────────────────────────────────────────
        const { cookies } = await import('next/headers');
        const { verifyToken } = await import('@/lib/utils/auth');

        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        const rl = await rateLimitByUser(payload.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        // ── Parse multipart form data ────────────────────────────────
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folderType = formData.get('folderType') as FolderType | null;
        const vendorId = (formData.get('vendorId') as string) || undefined;
        const userId = (formData.get('userId') as string) || undefined;

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!folderType || !VALID_FOLDER_TYPES.includes(folderType)) {
            return NextResponse.json(
                {
                    error: `Invalid folderType. Must be one of: ${VALID_FOLDER_TYPES.join(', ')}`,
                },
                { status: 400 }
            );
        }

        // ── Role-based validation ────────────────────────────────────
        // Banner uploads are admin-only
        if (folderType === 'banner' && payload.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Only admins can upload banners' },
                { status: 403 }
            );
        }

        // Vendor-specific uploads require vendor role (or admin)
        if (
            ['product', 'vendor-logo', 'vendor-banner'].includes(folderType) &&
            payload.role !== UserRole.VENDOR &&
            payload.role !== UserRole.ADMIN
        ) {
            return NextResponse.json(
                { error: 'Only vendors or admins can upload vendor images' },
                { status: 403 }
            );
        }

        // ── Resolve the Cloudinary folder ────────────────────────────
        // Fall back to the authenticated user's ID when no explicit userId
        const effectiveUserId = userId || payload.userId;
        const folder = resolveFolder(folderType, vendorId, effectiveUserId);

        if (!folder) {
            return NextResponse.json(
                {
                    error:
                        'Cannot resolve upload folder. Ensure vendorId or userId is provided for this folderType.',
                },
                { status: 400 }
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

        // Persist metadata to Prisma for supported folder types.
        // Cloudinary upload success is not blocked by DB persistence failure.
        const { persistUploadMetadata, getCacheBustedUrl } = await import('@/lib/services/asset');

        let persisted: { savedTo?: string; id?: string; error?: string } = { savedTo: 'none' };
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
        } catch (e) {
            persisted = {
                savedTo: 'none',
                error: e instanceof Error ? e.message : 'Unknown persistence error',
            };
        }

        const cacheBustedUrl = getCacheBustedUrl(result.url);

        return NextResponse.json(
            {
                success: true,
                url: result.url,
                cacheBustedUrl,
                publicId: result.publicId,
                width: result.width,
                height: result.height,
                format: result.format,
                persisted,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Upload error:', error);

        const message =
            error instanceof Error ? error.message : 'Upload failed';

        // Return a 400 for validation errors, 500 for everything else
        const isValidation =
            message.includes('not allowed') ||
            message.includes('exceeds') ||
            message.includes('Invalid image');
        const status = isValidation ? 400 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
