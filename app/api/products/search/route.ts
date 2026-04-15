/**
 * GET /api/products/search — Advanced search with sorting, filters, pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import type { Prisma } from '../../../../prisma/generated/client';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const category = searchParams.get('category');
        const vendorId = searchParams.get('vendorId');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const listingType = searchParams.get('listingType');
        const minRating = searchParams.get('minRating');
        const inStock = searchParams.get('inStock');
        const sort = searchParams.get('sort') || 'newest';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        const where: Prisma.ProductWhereInput = { isActive: true };
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { tags: { has: q.toLowerCase() } },
                { vendor: { storeName: { contains: q, mode: 'insensitive' } } },
            ];
        }
        if (category) where.category = category as Prisma.ProductWhereInput['category'];
        if (vendorId) where.vendorId = vendorId;
        if (listingType) where.listingType = listingType as Prisma.ProductWhereInput['listingType'];
        if (minRating) where.averageRating = { gte: parseFloat(minRating) };
        if (inStock === 'true') where.stock = { gt: 0 };
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        let orderBy: Prisma.ProductOrderByWithRelationInput;
        switch (sort) {
            case 'price-low': orderBy = { price: 'asc' }; break;
            case 'price-high': orderBy = { price: 'desc' }; break;
            case 'rating': orderBy = { averageRating: 'desc' }; break;
            case 'popular': orderBy = { sales: 'desc' }; break;
            default: orderBy = { createdAt: 'desc' };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { vendor: { select: { id: true, storeName: true, storeLogo: true, campus: true } } },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        // Compute available filter facets
        const allActive: Array<{ category: string; price: number }> = await prisma.product.findMany({
            where: { isActive: true },
            select: { category: true, price: true },
        });
        const categories = [...new Set(allActive.map((p) => p.category))];
        const prices = allActive.map((p) => p.price);
        const priceRange = { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };

        return NextResponse.json({
            success: true,
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
            filters: { categories, priceRange },
        });
    } catch (error) {
        console.error('GET /api/products/search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
