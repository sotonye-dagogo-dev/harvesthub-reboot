/**
 * GET /api/users/[id]/profile � Rich profile with stats
 * PUT /api/users/[id]/profile � Update profile details
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { CAMPUS_LOCATIONS, POSITION_OPTIONS, VENDOR_CATEGORIES, UserRole } from '@/lib/constants';
import { z } from 'zod';

interface RouteContext { params: Promise<{ id: string }>; }

const validCampusValues: Set<string> = new Set(CAMPUS_LOCATIONS.map((item) => item.value));
const validCategoryValues: Set<string> = new Set(VENDOR_CATEGORIES.map((item) => item.value));
const validPositionValues: Set<string> = new Set(POSITION_OPTIONS.map((item) => item.value));

const profileUpdateSchema = z
    .object({
        firstName: z.string().trim().min(1).max(120).optional(),
        lastName: z.string().trim().min(1).max(120).optional(),
        phoneNumber: z.string().trim().min(7).max(32).optional(),
        profilePicture: z.string().trim().max(2048).nullable().optional(),
        whatsappNumber: z.string().trim().max(32).optional(),
        category: z.string().trim().optional(),
        campus: z.string().trim().optional(),
        position: z.string().trim().optional(),
        businessAddress: z.string().trim().max(255).optional(),
    })
    .strict();

/**
 * Safely normalize unknown JSON fields (for example Prisma Json columns) into a record shape.
 */
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
        const parsedBody = profileUpdateSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json(
                {
                    error: 'Invalid profile update payload',
                    details: parsedBody.error.flatten(),
                },
                { status: 400 }
            );
        }

        const payload = parsedBody.data;
        const userUpdateData: Record<string, unknown> = {};
        if (payload.firstName !== undefined) userUpdateData.firstName = payload.firstName;
        if (payload.lastName !== undefined) userUpdateData.lastName = payload.lastName;
        if (payload.phoneNumber !== undefined) userUpdateData.phoneNumber = payload.phoneNumber;
        if (payload.profilePicture !== undefined) userUpdateData.profilePicture = payload.profilePicture;

        const updated = await prisma.$transaction(async (tx) => {
            const userUpdated = await tx.user.update({
                where: { id },
                data: userUpdateData,
                select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, profilePicture: true, role: true },
            });

            if (user.role === UserRole.VENDOR) {
                const vendor = await tx.vendor.findUnique({ where: { userId: user.userId } });
                if (vendor) {
                    const vendorUpdateData: Record<string, unknown> = {};
                    if (payload.category && validCategoryValues.has(payload.category)) {
                        vendorUpdateData.category = payload.category;
                    }
                    if (payload.campus && validCampusValues.has(payload.campus)) {
                        vendorUpdateData.campus = payload.campus;
                    }
                    if (payload.position && validPositionValues.has(payload.position)) {
                        vendorUpdateData.position = payload.position;
                    }
                    if (payload.whatsappNumber !== undefined) {
                        vendorUpdateData.whatsappNumber = payload.whatsappNumber;
                    } else if (
                        payload.phoneNumber !== undefined &&
                        (!vendor.whatsappNumber || vendor.whatsappNumber.trim().length === 0)
                    ) {
                        vendorUpdateData.whatsappNumber = payload.phoneNumber;
                    }

                    if (payload.businessAddress !== undefined) {
                        const existingVerification = toSafeRecord(vendor.businessVerification);
                        vendorUpdateData.businessVerification = {
                            ...existingVerification,
                            businessAddress: payload.businessAddress,
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
