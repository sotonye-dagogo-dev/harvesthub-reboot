/**
 * GET  /api/availability-requests — List requests (role-filtered)
 * POST /api/availability-requests — Create request (buyer only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const url = new URL(req.url);
        const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '20', 10), 1), 50);
        const status = url.searchParams.get('status');

        const where: Record<string, unknown> = {};

        if (user.role === UserRole.BUYER) {
            const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
            if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
            where.buyerId = buyer.id;
        } else if (user.role === UserRole.VENDOR) {
            const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
            if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
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

        return NextResponse.json({
            success: true,
            requests,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/availability-requests error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.BUYER) return NextResponse.json({ error: 'Only buyers can create requests' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });

        const { vendorId, items, buyerNote, expiresAt } = await req.json();
        if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'vendorId and items array are required' }, { status: 400 });
        }

        const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

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

        return NextResponse.json({ success: true, request }, { status: 201 });
    } catch (error) {
        console.error('POST /api/availability-requests error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
