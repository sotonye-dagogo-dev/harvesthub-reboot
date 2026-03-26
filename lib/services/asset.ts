import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@/lib/constants';

export type UploadPersistResult = {
    savedTo: 'vendor' | 'user' | 'advertisement' | 'proof_of_transfer' | 'banner' | 'vendor_content' | 'none';
    id?: string;
    error?: string;
};

export async function persistUploadMetadata(params: {
    folderType: string;
    vendorId?: string;
    userId?: string;
    effectiveUserId: string;
    url: string;
    publicId: string;
    payloadRole: UserRole;
    orderId?: string;
    amount?: number;
}): Promise<UploadPersistResult> {
    const {
        folderType,
        vendorId,
        userId,
        effectiveUserId,
        url,
        publicId,
        payloadRole,
        orderId,
        amount,
    } = params;

    const result: UploadPersistResult = { savedTo: 'none' };

    // Payload role is used for audit / security path verification in persistence.
    if (folderType === 'banner' && payloadRole !== UserRole.ADMIN) {
        return result;
    }
    // Persist explicit userId flow for profile uploads.
    if (folderType === 'profile' && !userId && payloadRole !== UserRole.ADMIN) {
        return result;
    }

    try {
        if (folderType === 'vendor-logo' && vendorId) {
            const v = await prisma.vendor.update({
                where: { id: vendorId },
                data: { storeLogo: url },
            });
            result.savedTo = 'vendor';
            result.id = v.id;
            return result;
        }

        if (folderType === 'vendor-banner' && vendorId) {
            const v = await prisma.vendor.update({
                where: { id: vendorId },
                data: { storeBanner: url },
            });
            result.savedTo = 'vendor';
            result.id = v.id;
            return result;
        }

        if (folderType === 'profile' && effectiveUserId) {
            const u = await prisma.user.update({
                where: { id: effectiveUserId },
                data: { profilePicture: url },
            });
            result.savedTo = 'user';
            result.id = u.id;
            return result;
        }

        if (folderType === 'ad') {
            const ad = await prisma.advertisement.create({
                data: {
                    advertiserId: effectiveUserId,
                    title: 'Uploaded Ad',
                    imageUrl: url,
                    imagePublicId: publicId,
                    dailyRate: 0,
                },
            });
            result.savedTo = 'advertisement';
            result.id = ad.id;
            return result;
        }

        if (folderType === 'payment-proof') {
            const proof = await prisma.proofOfTransfer.create({
                data: {
                    userId: effectiveUserId,
                    orderId: orderId ?? null,
                    imageUrl: url,
                    imagePublicId: publicId,
                    amount: amount ?? 0,
                },
            });
            result.savedTo = 'proof_of_transfer';
            result.id = proof.id;
            return result;
        }

        if (folderType === 'banner') {
            const banner = await prisma.banner.create({
                data: {
                    title: 'Uploaded Banner',
                    imageUrl: url,
                    createdBy: effectiveUserId,
                },
            });
            result.savedTo = 'banner';
            result.id = banner.id;
            return result;
        }

        if (folderType === 'product' && vendorId) {
            const vc = await prisma.vendorContent.create({
                data: {
                    vendorId,
                    type: 'IMAGE',
                    title: 'Uploaded Image',
                    mediaUrl: url,
                    mediaPublicId: publicId,
                },
            });
            result.savedTo = 'vendor_content';
            result.id = vc.id;
            return result;
        }

        return result;
    } catch (error: unknown) {
        console.error('[Asset] Failed to persist upload metadata', { folderType, url, publicId, error });
        result.error = (error instanceof Error ? error.message : 'Unknown error');
        return result;
    }
}

export function getCacheBustedUrl(url: string): string {
    const delimiter = url.includes('?') ? '&' : '?';
    return `${url}${delimiter}v=${Date.now()}`;
}
