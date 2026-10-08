/**
 * GET/POST /api/orders/[id]/requirements - service requirements gate (buyer)
 *
 * POST validates the buyer's answers against the purchased package's
 * `requirementFields`, persists them, and opens the fulfilment clock:
 * AWAITING_REQUIREMENTS -> IN_PROGRESS with `deadlineAt = now + deliveryDays·24h`.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ListingType, OrderStatus, Prisma } from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { appendStatusHistoryEntry, parseStatusHistory } from '@/lib/services/orderLifecycle';
import { dispatchNotification } from '@/lib/services/notifications';
import {
    computeServiceDeadline,
    getServiceDeliveryDays,
    isServiceItem,
    readServiceConfig,
} from '@/lib/services/serviceOrders';

interface RouteContext {
    params: Promise<{ id: string }>;
}

const MAX_FILE_URL = 600;
const MAX_ANSWERS = 40;
const MAX_STRING_LENGTH = 1200;

type RequirementField = {
    key: string;
    label?: string;
    type?: string;
    required?: boolean;
    options?: unknown;
};

const asFieldList = (value: unknown): RequirementField[] =>
    Array.isArray(value) ? (value as RequirementField[]) : [];

const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const isCloudinaryUrl = (url: string): boolean => url.startsWith('https://res.cloudinary.com/');

async function loadOrder(orderId: string) {
    return prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            orderNumber: true,
            status: true,
            buyerId: true,
            vendorId: true,
            items: {
                select: {
                    id: true,
                    listingType: true,
                    serviceConfig: true,
                    requirementAnswers: true,
                    requirementsSubmittedAt: true,
                    deadlineAt: true,
                    revisionsRemaining: true,
                },
            },
            vendor: { select: { id: true, userId: true, storeName: true } },
        },
    });
}

async function requireParticipant(order: Awaited<ReturnType<typeof loadOrder>>, userId: string, role: string) {
    if (!order) return { ok: false as const, status: 404 };
    const buyer = await prisma.buyer.findUnique({
        where: { userId },
        select: { id: true },
    });
    const isAdmin = role === UserRole.ADMIN;
    const isBuyer = Boolean(buyer && buyer.id === order.buyerId);
    const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
    const isSeller = Boolean(vendor && vendor.id === order.vendorId);
    if (!isAdmin && !isBuyer && !isSeller) return { ok: false as const, status: 403 };
    return { ok: true as const, isBuyer };
}

function validateAnswers(fields: RequirementField[], answers: Record<string, unknown>) {
    const issues: Array<{ key: string; message: string }> = [];
    const keys = Object.keys(answers);
    if (keys.length > MAX_ANSWERS) {
        issues.push({ key: 'answers', message: `Too many answers (max ${MAX_ANSWERS}).` });
        return issues;
    }

    for (const field of fields) {
        const key = field.key;
        const raw = answers[key];
        const empty =
            raw === undefined ||
            raw === null ||
            (typeof raw === 'string' && raw.trim().length === 0) ||
            (Array.isArray(raw) && raw.length === 0);

        if (field.required && empty) {
            issues.push({ key, message: `${field.label || key} is required.` });
            continue;
        }
        if (empty) continue;

        const type = (field.type || 'TEXT').toUpperCase();
        const value = Array.isArray(raw) ? raw[0] : raw;

        if (type === 'FILE') {
            const url = typeof value === 'string' ? value.trim() : '';
            if (!url || url.length > MAX_FILE_URL || !isCloudinaryUrl(url)) {
                issues.push({ key, message: `${field.label || key} must be a Cloudinary file link.` });
            }
            continue;
        }

        if (typeof value !== 'string') {
            issues.push({ key, message: `${field.label || key} must be text.` });
            continue;
        }
        if (value.length > MAX_STRING_LENGTH) {
            issues.push({ key, message: `${field.label || key} is too long.` });
            continue;
        }
        if (type === 'SELECT' && Array.isArray(field.options) && field.options.length > 0) {
            const allowed = field.options.map((option) => String(option));
            if (!allowed.includes(value)) {
                issues.push({ key, message: `${field.label || key} must be one of the offered options.` });
            }
        }
    }
    return issues;
}

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await context.params;
        const order = await loadOrder(id);
        const access = await requireParticipant(order, user.userId, user.role);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (!access.ok) {
            return NextResponse.json(
                { error: access.status === 404 ? 'Order not found' : 'Forbidden' },
                { status: access.status },
            );
        }

        const serviceItems = order.items.filter(isServiceItem);
        const config = readServiceConfig(serviceItems[0]);
        const fields = asFieldList(config?.requirementFields);
        const answers = asRecord(serviceItems[0]?.requirementAnswers);

        return NextResponse.json({
            success: true,
            status: order.status,
            fields,
            answers,
            submittedAt: serviceItems[0]?.requirementsSubmittedAt ?? null,
            deadlineAt: serviceItems[0]?.deadlineAt ?? null,
            revisionsRemaining: serviceItems[0]?.revisionsRemaining ?? null,
        });
    } catch (error) {
        console.error('GET /api/orders/[id]/requirements error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const order = await loadOrder(id);
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        const access = await requireParticipant(order, user.userId, user.role);
        if (!access.ok) {
            return NextResponse.json(
                { error: access.status === 404 ? 'Order not found' : 'Forbidden' },
                { status: access.status },
            );
        }
        if (!access.isBuyer) {
            return NextResponse.json({ error: 'Only the buyer can submit requirements' }, { status: 403 });
        }

        const serviceItems = order.items.filter(isServiceItem);
        if (serviceItems.length === 0) {
            return NextResponse.json({ error: 'Order has no service items' }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        const answers = asRecord(body?.answers);
        const fields = asFieldList(readServiceConfig(serviceItems[0])?.requirementFields);
        const issues = validateAnswers(fields, answers);
        if (issues.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Requirements are incomplete', code: 'REQUIREMENTS_INVALID', issues },
                { status: 400 },
            );
        }

        const submittedAt = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const current = await tx.order.findUnique({
                where: { id },
                select: { id: true, orderNumber: true, status: true, items: { select: { id: true, listingType: true, serviceConfig: true, requirementsSubmittedAt: true } } },
            });
            if (!current) throw new Error('ORDER_NOT_FOUND');

            // Idempotent replay: already through the gate — persist answers only if
            // nothing was stored yet, then return success without re-transitioning.
            if (current.status !== OrderStatus.AWAITING_REQUIREMENTS) {
                const alreadySubmitted = current.items.some((item) => item.requirementsSubmittedAt);
                if (alreadySubmitted) {
                    return { order: current, idempotent: true };
                }
                if (current.status === OrderStatus.CANCELLED || current.status === OrderStatus.REFUNDED) {
                    throw new Error('INVALID_TRANSITION');
                }
            }

            const deadlineItems = current.items.filter(isServiceItem);
            const deliveryDays = getServiceDeliveryDays(readServiceConfig(deadlineItems[0]));
            const deadlineAt = computeServiceDeadline(submittedAt, deliveryDays);

            await tx.orderItem.updateMany({
                where: { orderId: id, listingType: ListingType.SERVICE },
                data: {
                    requirementAnswers: answers as Prisma.InputJsonValue,
                    requirementsSubmittedAt: submittedAt,
                    deadlineAt,
                },
            });

            if (current.status !== OrderStatus.AWAITING_REQUIREMENTS) {
                return { order: current, idempotent: false, skipTransition: true };
            }

            const history = parseStatusHistory((await tx.order.findUnique({ where: { id }, select: { statusHistory: true } }))?.statusHistory as Prisma.JsonValue);
            const nextHistory = appendStatusHistoryEntry(
                history,
                OrderStatus.IN_PROGRESS,
                user.userId,
                `Requirements submitted. Fulfilment due in ${deliveryDays} day(s).`,
            );
            const updated = await tx.order.update({
                where: { id },
                data: { status: OrderStatus.IN_PROGRESS, statusHistory: nextHistory as Prisma.InputJsonValue },
            });
            return { order: updated, idempotent: false, skipTransition: false };
        });

        if (order.vendor) {
            void dispatchNotification({
                userId: order.vendor.userId,
                type: 'SERVICE_REQUIREMENTS_REQUESTED',
                title: 'Requirements submitted',
                message: `The buyer submitted requirements for order ${order.orderNumber}. You can start work now.`,
                link: `/orders/${order.id}`,
            }).catch(() => undefined);
        }

        return NextResponse.json({ success: true, idempotent: result.idempotent === true, order: result.order });
    } catch (error) {
        if (error instanceof Error && (error.message === 'ORDER_NOT_FOUND' || error.message === 'INVALID_TRANSITION')) {
            return NextResponse.json({ error: 'Order cannot accept requirements in its current state' }, { status: 409 });
        }
        console.error('POST /api/orders/[id]/requirements error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
