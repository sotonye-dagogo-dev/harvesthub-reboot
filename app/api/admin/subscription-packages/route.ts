/**
 * GET  /api/admin/subscription-packages — all packages (incl. inactive) with subscriber counts.
 * POST /api/admin/subscription-packages — create a package (admin-only).
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { UserRole } from '@/lib/constants';

async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) return null;
    if (user.role !== UserRole.ADMIN) return null;
    return user;
}

export const subscriptionPackageSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
    slug: z
        .string()
        .trim()
        .min(3, 'Slug must be at least 3 characters')
        .max(60, 'Slug must be 60 characters or fewer')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens'),
    description: z.string().trim().max(500, 'Description must be 500 characters or fewer').optional().nullable(),
    price: z.coerce
        .number()
        .min(0, 'Price cannot be negative')
        .max(10000000, 'Price must be 10,000,000 or fewer'),
    durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day').max(3650, 'Duration must be 3650 days or fewer'),
    features: z
        .array(z.string().trim().min(1).max(120))
        .max(20, 'A package can list at most 20 features')
        .optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(-1000).max(1000).optional(),
});

export async function GET() {
    return withApiHandler('GET /api/admin/subscription-packages', async () => {
        const admin = await requireAdmin();
        if (!admin) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(admin.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const packages = await prisma.subscriptionPackage.findMany({
            orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
            include: {
                _count: {
                    select: {
                        subscriptions: { where: { status: { in: ['ACTIVE', 'EXPIRED'] } } },
                    },
                },
            },
        });

        return apiSuccess({ packages });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/admin/subscription-packages', async () => {
        const admin = await requireAdmin();
        if (!admin) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(admin.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json().catch(() => null);
        const parsed = subscriptionPackageSchema.safeParse(body);
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return apiError(first ? `${first.path.join('.')}: ${first.message}` : 'Invalid package payload', 400, {
                code: 'INVALID_PACKAGE',
                issues: parsed.error.issues,
            });
        }

        const duplicate = await prisma.subscriptionPackage
            .findUnique({ where: { slug: parsed.data.slug }, select: { id: true } })
            .catch(() => null);
        if (duplicate) {
            return apiError('A package with this slug already exists.', 409, { code: 'SLUG_TAKEN' });
        }

        const created = await prisma.subscriptionPackage.create({
            data: {
                name: parsed.data.name,
                slug: parsed.data.slug,
                description: parsed.data.description ?? null,
                price: Math.round(parsed.data.price * 100) / 100,
                durationDays: parsed.data.durationDays,
                features: parsed.data.features ?? [],
                isActive: parsed.data.isActive ?? true,
                sortOrder: parsed.data.sortOrder ?? 0,
                updatedBy: admin.userId,
            },
        });

        return apiSuccess({ package: created }, 201);
    });
}
