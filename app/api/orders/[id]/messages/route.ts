/**
 * GET  /api/orders/[id]/messages — order-room chat history (participants only)
 * POST /api/orders/[id]/messages — send a chat message (participants only)
 *
 * Participants: the buyer, the ordered seller/vendor, and admins. Everyone else
 * gets 403 `{ success:false, error, code:'NOT_ORDER_PARTICIPANT' }`.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/** Chat body bound (mirrors `SERVICE_LIMITS.answerMax`). */
const MAX_BODY_CHARS = 2000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
/**
 * `OrderMessage` stores a single `attachmentUrl`/`attachmentName` pair (schema
 * is lead-owned), so at most one attachment is accepted per message rather
 * than silently dropping the extras.
 */
const MAX_ATTACHMENTS = 1;

type SessionUser = { userId: string; role: UserRole };

type Authorized =
    | { ok: true; user: SessionUser; order: { id: string; buyerId: string; vendorId: string } }
    | { ok: false; response: NextResponse };

function isCloudinaryUrl(raw: unknown): raw is string {
    if (typeof raw !== 'string' || raw.length === 0) return false;
    try {
        const url = new URL(raw);
        return (
            url.protocol === 'https:' &&
            (url.hostname === 'res.cloudinary.com' || url.hostname.endsWith('.cloudinary.com'))
        );
    } catch {
        return false;
    }
}

async function authorizeParticipant(orderId: string): Promise<Authorized> {
    const user: SessionUser | null = await getCurrentUser();
    if (!user) return { ok: false, response: apiError('Unauthorized', 401) };

    const rl = await rateLimitByUser(user.userId);
    if (!rl.success) return { ok: false, response: getRateLimitResponse(rl) };

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, buyerId: true, vendorId: true },
    });
    if (!order) return { ok: false, response: apiError('Order not found', 404) };
    if (user.role === UserRole.ADMIN) return { ok: true, user, order };

    const [buyer, vendor] = await Promise.all([
        prisma.buyer.findUnique({ where: { userId: user.userId }, select: { id: true } }),
        prisma.vendor.findUnique({ where: { userId: user.userId }, select: { id: true } }),
    ]);
    const isBuyer = Boolean(buyer && order.buyerId === buyer.id);
    const isSeller = Boolean(vendor && order.vendorId === vendor.id);
    if (!isBuyer && !isSeller) {
        return {
            ok: false,
            response: apiError('You are not a participant in this order.', 403, {
                code: 'NOT_ORDER_PARTICIPANT',
            }),
        };
    }
    return { ok: true, user, order };
}

export async function GET(req: NextRequest, context: RouteContext) {
    return withApiHandler('GET /api/orders/[id]/messages', async () => {
        const { id } = await context.params;
        const auth = await authorizeParticipant(id);
        if (!auth.ok) return auth.response;

        const params = req.nextUrl.searchParams;
        const after = params.get('after')?.trim() || null;
        const limitRaw = Number(params.get('limit'));
        const limit =
            Number.isFinite(limitRaw) && limitRaw > 0
                ? Math.min(Math.trunc(limitRaw), MAX_LIMIT)
                : DEFAULT_LIMIT;

        // Cursor: messages strictly newer than `after`. An unknown cursor id is
        // ignored (the caller simply receives the latest page).
        let cursor: { id: string; createdAt: Date } | null = null;
        if (after) {
            cursor = await prisma.orderMessage.findFirst({
                where: { id: after, orderId: id },
                select: { id: true, createdAt: true },
            });
        }

        const rows = await prisma.orderMessage.findMany({
            where: {
                orderId: id,
                ...(cursor
                    ? {
                          OR: [
                              { createdAt: { gt: cursor.createdAt } },
                              { createdAt: cursor.createdAt, id: { gt: cursor.id } },
                          ],
                      }
                    : {}),
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit,
        });

        // Newest-limited above, returned oldest → newest for direct rendering.
        return apiSuccess({ messages: rows.reverse() });
    });
}

export async function POST(req: NextRequest, context: RouteContext) {
    return withApiHandler('POST /api/orders/[id]/messages', async () => {
        const { id } = await context.params;
        const auth = await authorizeParticipant(id);
        if (!auth.ok) return auth.response;

        const payload = (await req.json().catch(() => null)) as {
            body?: unknown;
            attachments?: unknown;
        } | null;
        if (!payload || typeof payload !== 'object') {
            return apiError('Invalid JSON body.', 400, { code: 'INVALID_BODY' });
        }

        const body = typeof payload.body === 'string' ? payload.body.trim() : '';
        if (!body) {
            return apiError('Message body is required.', 400, {
                code: 'MESSAGE_BODY_INVALID',
                field: 'body',
            });
        }
        if (body.length > MAX_BODY_CHARS) {
            return apiError(`Message body must be ${MAX_BODY_CHARS} characters or fewer.`, 400, {
                code: 'MESSAGE_BODY_INVALID',
                field: 'body',
            });
        }

        const rawAttachments = payload.attachments ?? [];
        if (!Array.isArray(rawAttachments)) {
            return apiError('`attachments` must be an array.', 400, { code: 'ATTACHMENTS_INVALID' });
        }
        if (rawAttachments.length > MAX_ATTACHMENTS) {
            return apiError('A message can carry at most one attachment.', 400, {
                code: 'ATTACHMENTS_INVALID',
            });
        }

        let attachment: { url: string; name: string | null } | null = null;
        for (const entry of rawAttachments) {
            const candidate = (entry ?? null) as {
                url?: unknown;
                name?: unknown;
                type?: unknown;
            } | null;
            if (!candidate || typeof candidate !== 'object') {
                return apiError('Each attachment must be an object.', 400, {
                    code: 'ATTACHMENTS_INVALID',
                });
            }
            if (!isCloudinaryUrl(candidate.url)) {
                return apiError('Attachments must be Cloudinary-hosted HTTPS URLs.', 400, {
                    code: 'ATTACHMENT_NOT_CLOUDINARY',
                });
            }
            // `type` is accepted for forward compatibility but not persisted —
            // `OrderMessage` has no attachment-type column (lead-owned schema).
            attachment = {
                url: candidate.url,
                name: typeof candidate.name === 'string' && candidate.name ? candidate.name.slice(0, 200) : null,
            };
        }

        const created = await prisma.orderMessage.create({
            data: {
                orderId: id,
                senderId: auth.user.userId,
                senderRole: auth.user.role,
                body,
                attachmentUrl: attachment?.url ?? null,
                attachmentName: attachment?.name ?? null,
            },
        });

        return apiSuccess({ message: created }, 201);
    });
}
