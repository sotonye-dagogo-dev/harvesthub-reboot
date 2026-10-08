/**
 * GET    /api/products/[id] � Product detail
 * PUT    /api/products/[id] � Update product (vendor owner or admin)
 * DELETE /api/products/[id] � Delete product
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@/prisma/generated/client';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache/redis';
import { productKey } from '@/lib/cache/keys';
import { UserRole, SERVICE_UNLIMITED_STOCK } from '@/lib/constants';
import { SERVICE_LIMITS } from '@/lib/config/serviceFulfillment';
import {
    assertPublishableServiceDetails,
    baseServicePrice,
    serviceDetailsSchema,
} from '@/lib/schemas/service.schemas';

const isProvided = (value: unknown) => value !== null && value !== undefined && value !== '';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;

        const viewer = await getCurrentUser();
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                vendor: { select: { id: true, userId: true, storeName: true, storeLogo: true, campus: true, averageRating: true } },
                reviews: { where: { status: 'APPROVED' }, include: { buyer: { include: { user: { select: { firstName: true, lastName: true } } } }, votes: true }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Drafts (including service listings saved from the wizard) are private
        // to their vendor and to admins.
        const isOwner = !!viewer && (viewer.role === UserRole.ADMIN || product.vendor.userId === viewer.userId);
        if (!product.isActive && !isOwner) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.isActive) {
            const cacheK = productKey(id);
            const cached = await cacheGet(cacheK);
            if (cached) return NextResponse.json(cached);

            await prisma.product.update({ where: { id }, data: { views: { increment: 1 } } });

            const data = { success: true, product };
            await cacheSet(cacheK, data, 600);
            return NextResponse.json(data);
        }

        return NextResponse.json({ success: true, product, draft: true });
    } catch (error) {
        console.error('GET /api/products/[id] error:', error);
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
        const product = await prisma.product.findUnique({ where: { id }, include: { vendor: true } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        if (product.vendor.userId !== user.userId && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { vendorId: _vendorId, id: _id, createdAt: _createdAt, updatedAt: _updatedAt, vendor: _vendor, reviews: _reviews, orderItems: _orderItems, cartItems: _cartItems, bookings: _bookings, serviceDetails: serviceDetailsInput, ...updateData } = body;

        const nextListingType =
            updateData.listingType === 'SERVICE' || (!updateData.listingType && product.listingType === 'SERVICE')
                ? 'SERVICE'
                : 'PRODUCT';
        const nextIsActive = typeof updateData.isActive === 'boolean' ? updateData.isActive : product.isActive;

        let nextServiceDetails: unknown = product.serviceDetails ?? null;
        if (serviceDetailsInput !== undefined) {
            if (serviceDetailsInput === null) {
                nextServiceDetails = null;
            } else {
                const parsed = serviceDetailsSchema.safeParse(serviceDetailsInput);
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
                nextServiceDetails = parsed.data;
            }
        }

        if (nextListingType === 'SERVICE' && typeof updateData.name === 'string' && updateData.name.trim().length > SERVICE_LIMITS.titleMax) {
            return NextResponse.json(
                { error: `Service title must be at most ${SERVICE_LIMITS.titleMax} characters`, code: 'SERVICE_TITLE_TOO_LONG' },
                { status: 400 }
            );
        }

        // Publishing a service requires at least one package and a description:
        // checkout prices from the base package.
        if (nextListingType === 'SERVICE' && nextIsActive) {
            const issues = assertPublishableServiceDetails(nextServiceDetails);
            if (issues.length > 0) {
                return NextResponse.json({ error: issues[0], code: 'SERVICE_NOT_PUBLISHABLE', issues }, { status: 400 });
            }
            if (!isProvided(updateData.price)) {
                const basePrice = baseServicePrice(nextServiceDetails);
                if (basePrice !== null) updateData.price = basePrice;
            }
            if (!isProvided(updateData.stock)) updateData.stock = SERVICE_UNLIMITED_STOCK;
        }

        if (nextListingType === 'SERVICE') {
            updateData.serviceDetails = nextServiceDetails;
            if (!isProvided(updateData.stock)) updateData.stock = SERVICE_UNLIMITED_STOCK;
        } else if (serviceDetailsInput !== undefined) {
            updateData.serviceDetails = nextServiceDetails;
        }

        const updated = await prisma.product.update({ where: { id }, data: updateData as Prisma.ProductUncheckedUpdateInput });

        await cacheInvalidate(productKey(id));
        return NextResponse.json({ success: true, product: updated });
    } catch (error) {
        console.error('PUT /api/products/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const product = await prisma.product.findUnique({ where: { id }, include: { vendor: true } });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        if (product.vendor.userId !== user.userId && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.product.delete({ where: { id } });
        await cacheInvalidate(productKey(id));
        return NextResponse.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error('DELETE /api/products/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
