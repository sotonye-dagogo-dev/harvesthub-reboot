/**
 * GET /api/vendors — Public vendor list
 * POST /api/vendors — Create vendor profile (admin/vendor)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';
import { vendorListKey } from '@/lib/cache/keys';
import { Prisma, VendorStatus, Campus, VendorCategory } from '@/prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const status = (searchParams.get('status') as VendorStatus) || VendorStatus.APPROVED;
        const campus = searchParams.get('campus');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        const cacheKey = vendorListKey(JSON.stringify({ page, limit, status, campus, category, search }));
        const cached = await cacheGet(cacheKey);
        if (cached) return NextResponse.json(cached);

        const where: Prisma.VendorWhereInput = { status };
        if (campus) where.campus = campus as Campus;
        if (category) where.category = category as VendorCategory;
        if (search) {
            where.OR = [
                { storeName: { contains: search, mode: 'insensitive' } },
                { storeDescription: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [vendors, total] = await Promise.all([
            prisma.vendor.findMany({
                where,
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                    _count: { select: { products: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.vendor.count({ where }),
        ]);

        const result = {
            success: true,
            vendors: vendors.map((v) => ({
                ...v,
                productCount: (v as unknown as { _count: { products: number } })._count.products,
                _count: undefined,
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };

        await cacheSet(cacheKey, result, 300);
        return NextResponse.json(result);
    } catch (error) {
        console.error('GET /api/vendors error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { userId, storeName, storeDescription, category, campus } = body;

        const targetUserId = userId || user.userId;

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (targetUser.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Target user must have VENDOR role' }, { status: 400 });
        }

        const existing = await prisma.vendor.findUnique({ where: { userId: targetUserId } });
        if (existing) return NextResponse.json({ error: 'Vendor profile already exists' }, { status: 409 });

        if (!storeName) return NextResponse.json({ error: 'storeName is required' }, { status: 400 });

        const vendor = await prisma.vendor.create({
            data: {
                userId: targetUserId,
                storeName,
                storeDescription: storeDescription || '',
                category: (category || 'Others') as VendorCategory,
                campus: (campus || 'LEKKI') as Campus,
                whatsappNumber: '',
                status: VendorStatus.PENDING,
                commissionRate: 5,
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: false,
                    pickupServices: [],
                    deliveryZones: [],
                },
            },
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        });

        return NextResponse.json({ success: true, vendor }, { status: 201 });
    } catch (error) {
        console.error('POST /api/vendors error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
