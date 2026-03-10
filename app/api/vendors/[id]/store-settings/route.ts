/**
 * GET /api/vendors/[id]/store-settings � Get store settings
 * PUT /api/vendors/[id]/store-settings � Update store settings
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

        return NextResponse.json({ success: true, settings: vendor });
    } catch (error) {
        console.error('GET /api/vendors/[id]/store-settings error:', error);
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
        const vendor = await prisma.vendor.findUnique({ where: { id } });
        if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        if (user.role !== UserRole.ADMIN && vendor.userId !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const allowedFields = [
            'storeName', 'storeDescription', 'storeLogo', 'storeBanner',
            'campus', 'categories', 'businessPhone', 'whatsappNumber',
            'address', 'deliveryOptions', 'pickupOptions', 'operatingHours',
            'socialLinks', 'returnPolicy', 'shippingPolicy',
        ];
        const data: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) data[key] = body[key];
        }

        const updated = await prisma.vendor.update({ where: { id }, data });
        return NextResponse.json({ success: true, settings: updated });
    } catch (error) {
        console.error('PUT /api/vendors/[id]/store-settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
