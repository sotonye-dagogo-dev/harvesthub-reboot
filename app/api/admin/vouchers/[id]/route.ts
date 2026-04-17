/**
 * GET   /api/admin/vouchers/[id] � Voucher detail with redemptions
 * PATCH /api/admin/vouchers/[id] � Update voucher
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { VoucherType } from '@/prisma/generated/client';
import { buildVoucherScopeStorage, parseVoucherScope, type VoucherVisibility } from '@/lib/vouchers/scope';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const voucher = await prisma.voucher.findUnique({
            where: { id },
            include: {
                redemptions: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
                    orderBy: { redeemedAt: 'desc' },
                    take: 50,
                },
                _count: { select: { redemptions: true } },
            },
        });

        if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

        return NextResponse.json({ voucher });
    } catch (error) {
        console.error('GET /api/admin/vouchers/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const existing = await prisma.voucher.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

        const body = await req.json();
        const data: Record<string, unknown> = {};

        if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
        if (body.value !== undefined) data.value = Number(body.value);
        if (body.usageLimit !== undefined) data.usageLimit = body.usageLimit === null ? null : Number(body.usageLimit);
        if (body.perUserLimit !== undefined) data.perUserLimit = Number(body.perUserLimit);
        if (body.validFrom !== undefined) data.validFrom = new Date(body.validFrom);
        if (body.validTo !== undefined) data.validTo = new Date(body.validTo);
        if (body.maxDiscount !== undefined) data.maxDiscount = body.maxDiscount === null ? null : Number(body.maxDiscount);
        if (body.minOrderAmount !== undefined) data.minOrderAmount = Number(body.minOrderAmount);
        if (body.type !== undefined) {
            if (!Object.values(VoucherType).includes(body.type as VoucherType)) {
                return NextResponse.json({ error: 'Invalid voucher type' }, { status: 400 });
            }
            data.type = body.type;
        }

        const hasScopePatch =
            body.applicableCategories !== undefined ||
            body.applicableVendors !== undefined ||
            body.applicableCampuses !== undefined ||
            body.applicableProducts !== undefined ||
            body.visibility !== undefined;
        if (hasScopePatch) {
            const existingScope = parseVoucherScope(existing.applicableCategories, existing.applicableVendors);
            const mergedScope = {
                categories:
                    body.applicableCategories !== undefined
                        ? Array.isArray(body.applicableCategories) ? body.applicableCategories : []
                        : existingScope.categories,
                vendorIds:
                    body.applicableVendors !== undefined
                        ? Array.isArray(body.applicableVendors) ? body.applicableVendors : []
                        : existingScope.vendorIds,
                campuses:
                    body.applicableCampuses !== undefined
                        ? Array.isArray(body.applicableCampuses) ? body.applicableCampuses : []
                        : existingScope.campuses,
                productIds:
                    body.applicableProducts !== undefined
                        ? Array.isArray(body.applicableProducts) ? body.applicableProducts : []
                        : existingScope.productIds,
                visibility:
                    body.visibility !== undefined
                        ? (typeof body.visibility === 'string' ? body.visibility.toUpperCase() : 'PUBLIC') as VoucherVisibility
                        : existingScope.visibility,
            };
            const scopeStorage = buildVoucherScopeStorage(mergedScope);
            data.applicableCategories = scopeStorage.applicableCategories;
            data.applicableVendors = scopeStorage.applicableVendors;
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const voucher = await prisma.voucher.update({ where: { id }, data });
        return NextResponse.json({ success: true, voucher });
    } catch (error) {
        console.error('PATCH /api/admin/vouchers/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const existing = await prisma.voucher.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

        // Only allow deletion if no redemptions exist (safety guard)
        const redemptionCount = await prisma.voucherRedemption.count({ where: { voucherId: id } });
        if (redemptionCount > 0) {
            // Soft delete by deactivating instead of hard delete
            await prisma.voucher.update({ where: { id }, data: { isActive: false } });
            return NextResponse.json({ success: true, message: 'Voucher deactivated (has redemptions)' });
        }

        await prisma.voucher.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Voucher deleted' });
    } catch (error) {
        console.error('DELETE /api/admin/vouchers/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
