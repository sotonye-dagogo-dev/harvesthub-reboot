/**
 * GET /api/vendors/[id] � Vendor detail (public)
 * PUT /api/vendors/[id] � Update vendor (owner/admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';
import { vendorKey } from '@/lib/cache/keys';
import { UserRole } from '@/lib/constants';
import { sendVendorApprovalEmail } from '@/lib/services/email';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const cacheK = vendorKey(id);
        const cached = await cacheGet(cacheK);
        if (cached) return NextResponse.json({ success: true, vendor: cached });

        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                user: { select: { firstName: true, lastName: true, email: true, profilePicture: true } },
                products: { where: { isActive: true }, take: 8, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

        const ratingAgg = await prisma.review.aggregate({
            where: { product: { vendorId: id } },
            _avg: { rating: true },
            _count: true,
        });

        const result = {
            ...vendor,
            averageRating: ratingAgg._avg?.rating ?? 0,
            totalReviews: ratingAgg._count,
        };

        await cacheSet(cacheK, result, 300);
        return NextResponse.json({ success: true, vendor: result });
    } catch (error) {
        console.error('GET /api/vendors/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        if (user.role !== UserRole.ADMIN && vendor.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const previousStatus = vendor.status;
        const nextStatus = typeof body.status === 'string' ? body.status : undefined;
        const rejectionReason = typeof body.reason === 'string' ? body.reason.trim() : undefined;
        const allowedFields = ['storeName', 'storeDescription', 'storeLogo', 'storeBanner', 'campus',
            'categories', 'businessPhone', 'whatsappNumber', 'address', 'isActive', 'isVerified', 'status',
            'businessVerification'];
        const data: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) data[key] = body[key];
        }

        if (typeof data.storeName === 'string') {
            data.storeName = data.storeName.trim();
        }

        const updated = await prisma.vendor.update({ where: { id }, data });

        const shouldDispatchReviewEmail =
            user.role === UserRole.ADMIN &&
            typeof nextStatus === 'string' &&
            nextStatus !== previousStatus &&
            (nextStatus === 'APPROVED' || nextStatus === 'REJECTED') &&
            Boolean(vendor.user?.email);

        let emailDispatch: {
            attempted: boolean;
            sent: boolean;
            reason?: string;
        } = {
            attempted: false,
            sent: false,
            reason: 'not-required',
        };

        if (shouldDispatchReviewEmail && vendor.user?.email) {
            emailDispatch = {
                attempted: true,
                sent: false,
            };

            const emailResult = await sendVendorApprovalEmail(vendor.user.email, {
                firstName: vendor.user.firstName || vendor.user.lastName || 'there',
                storeName: updated.storeName,
                approved: nextStatus === 'APPROVED',
                rejectionReason: nextStatus === 'REJECTED' ? rejectionReason : undefined,
            });

            emailDispatch = {
                attempted: true,
                sent: emailResult.success,
                reason: emailResult.success ? undefined : emailResult.error || 'email-send-failed',
            };

            if (emailResult.success) {
                console.info('[vendors][review-email] dispatched', {
                    vendorId: id,
                    status: nextStatus,
                    adminId: user.userId,
                    email: vendor.user.email,
                });
            } else {
                console.warn('[vendors][review-email] failed', {
                    vendorId: id,
                    status: nextStatus,
                    adminId: user.userId,
                    email: vendor.user.email,
                    error: emailResult.error,
                });
            }
        }

        return NextResponse.json({ success: true, vendor: updated, emailDispatch });
    } catch (error) {
        console.error('PUT /api/vendors/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
