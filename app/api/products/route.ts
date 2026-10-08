/**
 * GET  /api/products — List products with filters, pagination, caching
 * POST /api/products — Create product (vendor only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import prismaAdapter from '@/lib/data/prismaAdapter';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet, cacheInvalidatePattern } from '@/lib/cache/redis';
import { productListKey } from '@/lib/cache/keys';
import { UserRole, SERVICE_UNLIMITED_STOCK } from '@/lib/constants';
import { SERVICE_LIMITS } from '@/lib/config/serviceFulfillment';
import { baseServicePrice, serviceDetailsSchema } from '@/lib/schemas/service.schemas';
import type { Prisma } from '../../../prisma/generated/client';

const isProvided = (value: unknown) => value !== null && value !== undefined && value !== '';

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
        const campus = searchParams.get('campus');
        const listingType = searchParams.get('listingType');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        // Public list default: active rows only, so vendor drafts (service
        // listings saved from the wizard, unpublished products) never leak.
        let effectiveVendorId = vendorId;
        let effectiveIsActive: boolean | undefined =
            isActive === null || isActive === undefined || isActive === ''
                ? true
                : isActive === 'true';

        if (includeInactive) {
            const user = await getCurrentUser();
            if (!user || (user.role !== UserRole.VENDOR && user.role !== UserRole.ADMIN)) {
                return NextResponse.json(
                    { error: 'Forbidden', code: 'INCLUDE_INACTIVE_FORBIDDEN' },
                    { status: 403 }
                );
            }
            if (user.role === UserRole.VENDOR) {
                const vendor = await prismaAdapter.vendorDb.findByUserId(user.userId);
                if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
                if (effectiveVendorId && effectiveVendorId !== vendor.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
                effectiveVendorId = vendor.id;
            }
            effectiveIsActive = undefined;
        }

        // Build cache key from filters
        const filterHash = JSON.stringify({ category, vendorId: effectiveVendorId, isActive: effectiveIsActive, isFeatured, search, campus, listingType, minPrice, maxPrice, page, limit });
        const cacheKey = productListKey(filterHash);
        if (!includeInactive) {
            const cached = await cacheGet<{ products: unknown[]; total: number }>(cacheKey);
            if (cached) {
                return NextResponse.json({ success: true, products: cached.products, pagination: { total: cached.total, page, limit, totalPages: Math.ceil(cached.total / limit) } });
            }
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
                { vendor: { storeName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }
        // Note: campus filtering is not passed to prismaAdapter (handled client-side).
        // campus is included in filterHash for cache invalidation only.

        // Use unified data layer (db.products) so behavior is consistent between mock and Prisma adapters
        const productsResult = await prismaAdapter.productDb.findAll({ category, vendorId: effectiveVendorId, isActive: effectiveIsActive, isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined, search, listingType, minPrice: minPrice ? parseFloat(minPrice) : undefined, maxPrice: maxPrice ? parseFloat(maxPrice) : undefined, page, limit }) as any;

        // Normalize result: mock adapter returns pagination object when page/limit provided
        const products = Array.isArray(productsResult) ? productsResult : productsResult.data;
        const total = await prismaAdapter.productDb.count({ category, vendorId: effectiveVendorId, isActive: effectiveIsActive, isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined, search, listingType, minPrice: minPrice ? parseFloat(minPrice) : undefined, maxPrice: maxPrice ? parseFloat(maxPrice) : undefined });

        if (!includeInactive) {
            await cacheSet(cacheKey, { products, total }, 300);
        }

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

        const resolvedListingType = listingType === 'SERVICE' ? 'SERVICE' : 'PRODUCT';

        // Service listings carry a typed serviceDetails payload — validate before
        // anything else so its base package price can act as the default price.
        let parsedServiceDetails: unknown = null;
        if (resolvedListingType === 'SERVICE' && serviceDetails !== undefined && serviceDetails !== null) {
            const parsed = serviceDetailsSchema.safeParse(serviceDetails);
            if (!parsed.success) {
                return NextResponse.json(
                    {
                        error: parsed.error.issues[0]?.message ?? 'Invalid service details',
                        code: 'SERVICE_DETAILS_INVALID',
                        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
                    },
                    { status: 400 }
                );
            }
            parsedServiceDetails = parsed.data;
        }

        const missingFields = [
            ...(!name ? ['name'] : []),
            ...(!description ? ['description'] : []),
            ...(!category ? ['category'] : []),
            // Service listings derive their price from the base package when omitted.
            ...(resolvedListingType !== 'SERVICE' && price === undefined ? ['price'] : []),
            ...(!mainImage ? ['mainImage'] : []),
        ];
        if (missingFields.length > 0) {
            return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
        }

        if (resolvedListingType === 'SERVICE' && String(name).trim().length > SERVICE_LIMITS.titleMax) {
            return NextResponse.json(
                { error: `Service title must be at most ${SERVICE_LIMITS.titleMax} characters`, code: 'SERVICE_TITLE_TOO_LONG' },
                { status: 400 }
            );
        }

        // For vendors, find their vendor profile via unified data layer
        let vendorId = body.vendorId;
        if (user.role === UserRole.VENDOR) {
            const vendor = await prismaAdapter.vendorDb.findByUserId(user.userId);
            if (!vendor) return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
            vendorId = vendor.id;
        }
        if (!vendorId) {
            return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
        }

        const vendor = await prismaAdapter.vendorDb.findById(vendorId);
        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        const numericPrice = isProvided(price)
            ? Number(price)
            : resolvedListingType === 'SERVICE'
                ? baseServicePrice(parsedServiceDetails) ?? Number.NaN
                : Number.NaN;
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return NextResponse.json({ error: 'Price must be a valid positive number' }, { status: 400 });
        }

        const numericCompareAtPrice = isProvided(compareAtPrice)
            ? Number(compareAtPrice)
            : null;
        if (numericCompareAtPrice !== null && (!Number.isFinite(numericCompareAtPrice) || numericCompareAtPrice <= 0)) {
            return NextResponse.json({ error: 'Compare at price must be a valid positive number' }, { status: 400 });
        }

        const numericDiscount = isProvided(discount)
            ? Number(discount)
            : 0;
        if (!Number.isFinite(numericDiscount) || numericDiscount < 0) {
            return NextResponse.json({ error: 'Discount must be a valid non-negative number' }, { status: 400 });
        }

        const numericStock = isProvided(stock)
            ? Number(stock)
            : resolvedListingType === 'SERVICE'
                ? SERVICE_UNLIMITED_STOCK
                : 0;
        if (!Number.isFinite(numericStock) || numericStock < 0) {
            return NextResponse.json({ error: 'Stock must be a valid non-negative number' }, { status: 400 });
        }

        const product = await prismaAdapter.productDb.create({
            vendorId: vendor.id,
            name,
            description,
            category,
            price: numericPrice,
            compareAtPrice: numericCompareAtPrice,
            discount: numericDiscount,
            stock: Math.floor(numericStock),
            images: images || [],
            mainImage,
            // Preserve explicit [] (sizing disabled) vs null (fallback to category config)
            variants: Array.isArray(variants) ? variants : variants ?? null,
            tags: tags || [],
            isFeatured: isFeatured || false,
            listingType: resolvedListingType,
            serviceDetails: parsedServiceDetails,
        });

        // Increment vendor product count (use vendor object if available)
        try {
            const v = await prisma.vendor.findUnique({ where: { id: vendor.id }, select: { totalProducts: true } });
            if (v) {
                await prisma.vendor.update({ where: { id: vendor.id }, data: { totalProducts: (v.totalProducts || 0) + 1 } });
            }
        } catch (e) {
            // non-fatal: continue
            console.warn('Could not increment vendor product count', e);
        }

        // Invalidate product list caches
        await cacheInvalidatePattern('cache:products:*');

        return NextResponse.json({ success: true, product }, { status: 201 });
    } catch (error) {
        console.error('POST /api/products error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
