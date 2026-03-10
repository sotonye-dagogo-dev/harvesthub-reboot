/**
 * Vendor Content API — GET list + POST create
 * Vendor-scoped: only the vendor owner (or admin) can access.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, rateLimitHeaders } from '@/lib/utils/redis';
import { createVendorContentSchema } from '@/lib/schemas/vendor-content.schemas';
import { uploadImage, getVendorContentFolder } from '@/lib/services/cloudinary';

// ─── GET: list content for a vendor ──────────────────────────────────────────

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id: vendorId } = await context.params;

        // Vendor can only see their own content; admin can see any
        if (user.role !== 'ADMIN') {
            const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
            if (!vendor || vendor.userId !== user.userId) {
                return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
            }
        }

        const content = await prisma.vendorContent.findMany({
            where: { vendorId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: content });
    } catch (error) {
        console.error('[VendorContent GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch content' }, { status: 500 });
    }
}

// ─── POST: create new content ────────────────────────────────────────────────

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const rl = await rateLimitByUser(user.userId, 20, 60);
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: 'Too many requests' },
                { status: 429, headers: rateLimitHeaders(rl) }
            );
        }

        const { id: vendorId } = await context.params;

        // Only vendor owner can create content
        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
        if (!vendor || vendor.userId !== user.userId) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { mediaFile, ...fields } = body;

        const parsed = createVendorContentSchema.safeParse(fields);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Validation error', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        let mediaUrl: string | undefined;
        let mediaPublicId: string | undefined;

        // Upload media file if provided (base64 data URI)
        if (mediaFile && typeof mediaFile === 'string' && mediaFile.startsWith('data:')) {
            const folder = getVendorContentFolder(vendorId);
            const allowedFormats = parsed.data.type === 'VIDEO'
                ? ['mp4', 'webm', 'mov']
                : ['jpeg', 'jpg', 'png', 'webp'];
            const result = await uploadImage(mediaFile, folder, { maxSizeMB: 10, allowedFormats });
            mediaUrl = result.url;
            mediaPublicId = result.publicId;
        }

        const content = await prisma.vendorContent.create({
            data: {
                vendorId,
                type: parsed.data.type,
                title: parsed.data.title,
                description: parsed.data.description,
                textContent: parsed.data.textContent,
                usageRights: parsed.data.usageRights,
                targetPlatform: parsed.data.targetPlatform,
                validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : undefined,
                validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : undefined,
                mediaUrl,
                mediaPublicId,
            },
        });

        return NextResponse.json({ success: true, data: content }, { status: 201 });
    } catch (error) {
        console.error('[VendorContent POST]', error);
        return NextResponse.json({ success: false, error: 'Failed to create content' }, { status: 500 });
    }
}
