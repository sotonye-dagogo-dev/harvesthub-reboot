/**
 * Vendor Content Item API — PUT update + DELETE
 * Vendor-scoped: only the vendor owner can modify/delete their content.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, rateLimitHeaders } from '@/lib/utils/redis';
import { deleteImage } from '@/lib/services/cloudinary';

type RouteContext = { params: Promise<{ id: string; contentId: string }> };

// ─── PUT: update content item ────────────────────────────────────────────────

export async function PUT(req: Request, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const rl = await rateLimitByUser(user.userId, 30, 60);
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests' },
                { status: 429, headers: rateLimitHeaders(rl) }
            );
        }

        const { id: vendorId, contentId } = await context.params;

        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
        if (!vendor || vendor.userId !== user.userId) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const existing = await prisma.vendorContent.findFirst({
            where: { id: contentId, vendorId },
        });
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
        }

        const body = await req.json();
        const allowedFields = ['title', 'description', 'textContent', 'usageRights', 'targetPlatform', 'validFrom', 'validTo'] as const;
        const data: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (field in body) {
                if (field === 'validFrom' || field === 'validTo') {
                    data[field] = body[field] ? new Date(body[field] as string) : null;
                } else {
                    data[field] = body[field];
                }
            }
        }

        // If content was rejected, reset to PENDING when vendor updates it
        if (existing.status === 'REJECTED' && Object.keys(data).length > 0) {
            data.status = 'PENDING';
            data.rejectionReason = null;
        }

        const updated = await prisma.vendorContent.update({
            where: { id: contentId },
            data,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[VendorContent PUT]', error);
        return NextResponse.json({ success: false, error: 'Failed to update content' }, { status: 500 });
    }
}

// ─── DELETE: remove content item ─────────────────────────────────────────────

export async function DELETE(_req: Request, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id: vendorId, contentId } = await context.params;

        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
        if (!vendor || vendor.userId !== user.userId) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const existing = await prisma.vendorContent.findFirst({
            where: { id: contentId, vendorId },
        });
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
        }

        // Delete associated media from Cloudinary
        if (existing.mediaPublicId) {
            await deleteImage(existing.mediaPublicId);
        }

        await prisma.vendorContent.delete({ where: { id: contentId } });

        return NextResponse.json({ success: true, message: 'Content deleted' });
    } catch (error) {
        console.error('[VendorContent DELETE]', error);
        return NextResponse.json({ success: false, error: 'Failed to delete content' }, { status: 500 });
    }
}
