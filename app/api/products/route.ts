/**
 * GET  /api/products — List products with filters, pagination, caching
 * POST /api/products — Create product (vendor only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '@/lib/cache/redis';
import { productListKey } from '@/lib/cache/keys';
import { UserRole } from '@/lib/constants';
import type { Prisma } from '../../../prisma/generated/client';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const vendorId = searchParams.get('vendorId');
        const isActive = searchParams.get('isActive');
        const isFeatured = searchParams.get('isFeatured');
        const search = searchParams.get('search');
        const listingType = searchParams.get('listingType');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        // Build cache key from filters
        const filterHash = JSON.stringify({ category, vendorId, isActive, isFeatured, search, listingType, minPrice, maxPrice, page, limit });
        const cacheKey = productListKey(filterHash);
        const cached = await cacheGet<{ products: unknown[]; total: number }>(cacheKey);
        if (cached) {
            return NextResponse.json({ success: true, products: cached.products, pagination: { total: cached.total, page, limit, totalPages: Math.ceil(cached.total / limit) } });
        }

        const where: Prisma.ProductWhereInput = {};
        if (category) where.category = category as Prisma.ProductWhereInput['category'];
        if (vendorId) where.vendorId = vendorId;
        if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true';
        if (isFeatured !== null && isFeatured !== undefined && isFeatured !== '') where.isFeatured = isFeatured === 'true';
        if (listingType) where.listingType = listingType as Prisma.ProductWhereInput['listingType'];
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search.toLowerCase() } },
            ];
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        await cacheSet(cacheKey, { products, total }, 300);

        return NextResponse.json({
            success: true,
            products,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/products error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.VENDOR && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Only vendors can create products' }, { status: 403 });
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { name, description, category, price, compareAtPrice, discount, stock, images, mainImage, variants, tags, isFeatured, listingType, serviceDetails } = body;

        if (!name || !description || !category || price === undefined || !mainImage) {
            return NextResponse.json({ error: 'Missing required fields: name, description, category, price, mainImage' }, { status: 400 });
        }

        // For vendors, find their vendor profile
        let vendorId = body.vendorId;
        if (user.role === UserRole.VENDOR) {
            const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
            if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
            vendorId = vendor.id;
        }

        const product = await prisma.product.create({
            data: {
                vendorId,
                name,
                description,
                category,
                price: parseFloat(price),
                compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
                discount: discount ? parseFloat(discount) : 0,
                stock: stock !== undefined ? parseInt(stock) : 0,
                images: images || [],
                mainImage,
                variants: variants || null,
                tags: tags || [],
                isFeatured: isFeatured || false,
                listingType: listingType || 'PRODUCT',
                serviceDetails: serviceDetails || null,
            },
            include: { vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } } },
        });

        // Increment vendor product count
        await prisma.vendor.update({ where: { id: vendorId }, data: { totalProducts: { increment: 1 } } });

        // Invalidate product list caches
        await cacheInvalidatePattern('cache:products:*');

        return NextResponse.json({ success: true, product }, { status: 201 });
    } catch (error) {
        console.error('POST /api/products error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
