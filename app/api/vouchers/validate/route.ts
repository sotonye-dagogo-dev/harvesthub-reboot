/**
 * POST /api/vouchers/validate — Validate voucher code (buyer)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { parseVoucherScope, voucherAppliesToContext } from '@/lib/vouchers/scope';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { code, orderTotal, cartItems, vendorIds: vendorIdsInput, categories: categoriesInput, campuses: campusesInput, productIds: productIdsInput } = await req.json();
        if (!code) return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
        const normalizedOrderTotal = Number(orderTotal ?? 0);

        const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });
        if (!voucher) return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 });

        // Check active
        if (!voucher.isActive) return NextResponse.json({ error: 'Voucher is inactive' }, { status: 400 });

        // Check dates
        const now = new Date();
        if (voucher.validFrom && now < voucher.validFrom) {
            return NextResponse.json({ error: 'Voucher is not yet active' }, { status: 400 });
        }
        if (voucher.validTo && now > voucher.validTo) {
            return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 });
        }

        // Check usage limits
        if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
            return NextResponse.json({ error: 'Voucher usage limit reached' }, { status: 400 });
        }

        // Check per-user limit
        if (voucher.perUserLimit) {
            const userRedemptions = await prisma.voucherRedemption.count({
                where: { voucherId: voucher.id, userId: user.userId },
            });
            if (userRedemptions >= voucher.perUserLimit) {
                return NextResponse.json({ error: 'You have already used this voucher the maximum number of times' }, { status: 400 });
            }
        }

        const scope = parseVoucherScope(voucher.applicableCategories, voucher.applicableVendors);

        const productIdsFromItems = Array.isArray(cartItems)
            ? cartItems
                .map((item: unknown) =>
                    item && typeof item === 'object' && typeof (item as { productId?: unknown }).productId === 'string'
                        ? (item as { productId: string }).productId
                        : null
                )
                .filter((entry: string | null): entry is string => Boolean(entry))
            : [];

        const explicitProductIds = Array.isArray(productIdsInput)
            ? productIdsInput.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
            : [];
        const scopedProductIds = Array.from(new Set([...productIdsFromItems, ...explicitProductIds]));

        const products = scopedProductIds.length > 0
            ? await prisma.product.findMany({
                where: { id: { in: scopedProductIds } },
                select: {
                    id: true,
                    category: true,
                    vendorId: true,
                    vendor: { select: { campus: true } },
                },
            })
            : [];

        const vendorIdsFromItems = Array.isArray(cartItems)
            ? cartItems
                .map((item: unknown) =>
                    item && typeof item === 'object' && typeof (item as { vendorId?: unknown }).vendorId === 'string'
                        ? (item as { vendorId: string }).vendorId
                        : null
                )
                .filter((entry: string | null): entry is string => Boolean(entry))
            : [];
        const explicitVendorIds = Array.isArray(vendorIdsInput)
            ? vendorIdsInput.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
            : [];

        const categoriesFromProducts = products
            .map((product) => (typeof product.category === 'string' ? product.category : null))
            .filter((entry: string | null): entry is string => Boolean(entry));
        const explicitCategories = Array.isArray(categoriesInput)
            ? categoriesInput.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
            : [];

        const campusesFromProducts = products
            .map((product) => (typeof product.vendor?.campus === 'string' ? product.vendor.campus : null))
            .filter((entry: string | null): entry is string => Boolean(entry));
        const explicitCampuses = Array.isArray(campusesInput)
            ? campusesInput.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0)
            : [];

        const applicabilityContext = {
            vendorIds: Array.from(new Set([...vendorIdsFromItems, ...explicitVendorIds, ...products.map((product) => product.vendorId)]))
                .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0),
            categories: Array.from(new Set([...categoriesFromProducts, ...explicitCategories]))
                .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0),
            campuses: Array.from(new Set([...campusesFromProducts, ...explicitCampuses]))
                .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0),
            productIds: scopedProductIds,
        };
        if (!voucherAppliesToContext(scope, applicabilityContext)) {
            return NextResponse.json({ error: 'Voucher is not applicable to this checkout selection' }, { status: 400 });
        }

        // Check minimum order
        if (voucher.minOrderAmount && normalizedOrderTotal < Number(voucher.minOrderAmount)) {
            return NextResponse.json({
                error: `Minimum order amount is ₦${voucher.minOrderAmount}`,
            }, { status: 400 });
        }

        // Calculate discount
        let discount = 0;
        if (voucher.type === 'PERCENTAGE') {
            discount = normalizedOrderTotal * (Number(voucher.value) / 100);
            if (voucher.maxDiscount) discount = Math.min(discount, Number(voucher.maxDiscount));
        } else if (voucher.type === 'FREE_DELIVERY') {
            discount = Math.min(Number(voucher.value) || 0, normalizedOrderTotal);
        } else {
            discount = Number(voucher.value);
        }

        return NextResponse.json({
            success: true,
            voucher: {
                id: voucher.id,
                code: voucher.code,
                type: voucher.type,
                value: voucher.value,
                discount,
            },
        });
    } catch (error) {
        console.error('POST /api/vouchers/validate error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
