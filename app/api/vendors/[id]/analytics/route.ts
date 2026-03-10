/**
 * GET /api/vendors/[id]/analytics � Vendor dashboard analytics
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const vendor = await prisma.vendor.findUnique({ where: { id } });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        if (user.role !== UserRole.ADMIN && vendor.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const url = new URL(req.url);
        const daysStr = url.searchParams.get('days') ?? '30';
        const days = Math.min(Math.max(parseInt(daysStr, 10) || 30, 1), 365);
        const since = new Date(Date.now() - days * 86400000);

        const [totalProducts, activeProducts, totalOrders, revenueAgg, ratingAgg, recentOrders] = await Promise.all([
            prisma.product.count({ where: { vendorId: id } }),
            prisma.product.count({ where: { vendorId: id, isActive: true } }),
            prisma.order.count({ where: { vendorId: id, createdAt: { gte: since } } }),
            prisma.order.aggregate({
                where: { vendorId: id, status: { in: ['DELIVERED'] }, createdAt: { gte: since } },
                _sum: { total: true },
            }),
            prisma.review.aggregate({
                where: { product: { vendorId: id } },
                _avg: { rating: true },
                _count: true,
            }),
            prisma.order.findMany({
                where: { vendorId: id },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
            }),
        ]);

        const analytics = {
            totalProducts,
            activeProducts,
            totalOrders,
            revenue: (revenueAgg._sum as { total?: number | null })?.total ?? 0,
            averageRating: ratingAgg._avg?.rating ?? 0,
            totalReviews: ratingAgg._count,
            recentOrders,
            period: { days, since: since.toISOString() },
        };

        return NextResponse.json({ success: true, analytics });
    } catch (error) {
        console.error('GET /api/vendors/[id]/analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
