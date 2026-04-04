/**
 * GET  /api/availability-requests — List requests (role-filtered)
 * POST /api/availability-requests — Create request (buyer only)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/availability-requests', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const url = new URL(req.url);
        const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 50);
        const status = url.searchParams.get('status');

        const where: Record<string, unknown> = {};

        if (user.role === UserRole.BUYER) {
            const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
            if (!buyer) return apiError('Buyer profile not found', 404);
            where.buyerId = buyer.id;
        } else if (user.role === UserRole.VENDOR) {
            const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
            if (!vendor) return apiError('Vendor profile not found', 404);
            where.vendorId = vendor.id;
        }
        // Admin sees all

        if (status) where.status = status;

        const [requests, total] = await Promise.all([
            prisma.productAvailabilityRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    buyer: { include: { user: { select: { firstName: true, lastName: true } } } },
                    vendor: { select: { id: true, storeName: true } },
                },
            }),
            prisma.productAvailabilityRequest.count({ where }),
        ]);

        return apiSuccess({
            requests,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/availability-requests', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.BUYER) return apiError('Only buyers can create requests', 403);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return apiError('Buyer profile not found', 404);

        const { vendorId, items, buyerNote, expiresAt } = await req.json();
        if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
            return apiError('vendorId and items array are required', 400);
        }

        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) return apiError('Vendor not found', 404);

        const request = await prisma.productAvailabilityRequest.create({
            data: {
                buyerId: buyer.id,
                vendorId,
                items,
                buyerNote: buyerNote ?? null,
                status: 'PENDING',
                expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 86400000),
            },
        });

        return apiSuccess({ request }, 201);
    });
}
