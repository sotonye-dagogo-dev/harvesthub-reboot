/**
 * GET /api/users/[id]/profile � Rich profile with stats
 * PUT /api/users/[id]/profile � Update profile details
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { CAMPUS_LOCATIONS, POSITION_OPTIONS, VENDOR_CATEGORIES, UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

const validCampusValues = new Set(CAMPUS_LOCATIONS.map((item) => item.value));
const validCategoryValues = new Set(VENDOR_CATEGORIES.map((item) => item.value));
const validPositionValues = new Set(POSITION_OPTIONS.map((item) => item.value));

function toSafeRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        if (user.role !== UserRole.ADMIN && user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const found = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, firstName: true, lastName: true, email: true,
                phoneNumber: true, profilePicture: true, role: true, emailVerified: true,
                createdAt: true, updatedAt: true,
                buyer: { select: { id: true } },
                vendor: {
                    select: {
                        id: true,
                        storeName: true,
                        status: true,
                        category: true,
                        campus: true,
                        position: true,
                        whatsappNumber: true,
                        businessVerification: true,
                    },
                },
            },
        });
        if (!found) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Compute stats based on role
        let stats: Record<string, number> = {};
        if (found.buyer) {
            const [orderCount, reviewCount, milestoneCount] = await Promise.all([
                prisma.order.count({ where: { buyerId: found.buyer.id } }),
                prisma.review.count({ where: { buyerId: found.buyer.id } }),
                prisma.userMilestone.count({ where: { userId: id } }),
            ]);
            stats = { orderCount, reviewCount, milestoneCount };
        }
        if (found.vendor) {
            const [productCount, orderCount, revenueAgg] = await Promise.all([
                prisma.product.count({ where: { vendorId: found.vendor.id } }),
                prisma.order.count({ where: { vendorId: found.vendor.id } }),
                prisma.order.aggregate({
                    where: { vendorId: found.vendor.id, status: { in: ['DELIVERED'] } },
                    _sum: { total: true },
                }),
            ]);
            stats = { ...stats, productCount, vendorOrderCount: orderCount, totalRevenue: Number((revenueAgg._sum as { total?: number | null })?.total ?? 0) };
        }

        const vendorBusinessAddress =
            found.vendor && typeof toSafeRecord(found.vendor.businessVerification).businessAddress === 'string'
                ? toSafeRecord(found.vendor.businessVerification).businessAddress
                : '';

        return NextResponse.json({
            success: true,
            profile: {
                ...found,
                stats,
                vendorContext: found.vendor
                    ? {
                        category: found.vendor.category,
                        campus: found.vendor.campus,
                        position: found.vendor.position,
                        whatsappNumber: found.vendor.whatsappNumber,
                        businessAddress: vendorBusinessAddress,
                    }
                    : null,
            },
        });
    } catch (error) {
        console.error('GET /api/users/[id]/profile error:', error);
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
        if (user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'profilePicture', 'whatsappNumber'];
        const data: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) data[key] = body[key];
        }

        const updated = await prisma.$transaction(async (tx) => {
            const userUpdated = await tx.user.update({
                where: { id },
                data,
                select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, profilePicture: true, role: true },
            });

            if (user.role === UserRole.VENDOR) {
                const vendor = await tx.vendor.findUnique({ where: { userId: user.userId } });
                if (vendor) {
                    const vendorUpdateData: Record<string, unknown> = {};
                    if (body.category && validCategoryValues.has(body.category)) {
                        vendorUpdateData.category = body.category;
                    }
                    if (body.campus && validCampusValues.has(body.campus)) {
                        vendorUpdateData.campus = body.campus;
                    }
                    if (body.position && validPositionValues.has(body.position)) {
                        vendorUpdateData.position = body.position;
                    }
                    if (body.whatsappNumber !== undefined) {
                        vendorUpdateData.whatsappNumber = String(body.whatsappNumber).trim();
                    }

                    if (body.businessAddress !== undefined) {
                        const existingVerification = toSafeRecord(vendor.businessVerification);
                        vendorUpdateData.businessVerification = {
                            ...existingVerification,
                            businessAddress: String(body.businessAddress).trim(),
                        };
                    }

                    if (Object.keys(vendorUpdateData).length > 0) {
                        await tx.vendor.update({
                            where: { id: vendor.id },
                            data: vendorUpdateData,
                        });
                    }
                }
            }

            return userUpdated;
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error('PUT /api/users/[id]/profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
