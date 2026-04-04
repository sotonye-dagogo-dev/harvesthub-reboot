/**
 * POST /api/ads — Submit a new advertisement
 * GET  /api/ads/active and /api/ads/my-ads are separate routes
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { z } from 'zod';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

const createAdSchema = z.object({
    title: z.string().trim().min(2, 'Title is required'),
    subtitle: z.string().trim().optional().nullable(),
    ctaText: z.string().trim().optional().nullable(),
    ctaLink: z.string().trim().url().optional().nullable(),
    imageUrl: z.string().trim().url('A valid image URL is required'),
    imagePublicId: z.string().trim().optional().nullable(),
    dailyRate: z.coerce.number().positive('dailyRate must be a positive number'),
    startDate: z.string().datetime('startDate must be a valid ISO datetime'),
    duration: z.coerce.number().int().min(1, 'duration must be a positive integer (days)'),
});

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/ads', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const parsedBody = createAdSchema.safeParse(await req.json());
        if (!parsedBody.success) {
            return apiError('Invalid request payload', 400, {
                details: parsedBody.error.flatten(),
            });
        }

        const data = parsedBody.data;
        const parsedStart = new Date(data.startDate);

        const endDate = new Date(parsedStart);
        endDate.setDate(endDate.getDate() + data.duration);

        const ad = await prisma.advertisement.create({
            data: {
                advertiserId: user.userId,
                title: data.title,
                subtitle: data.subtitle ?? null,
                ctaText: data.ctaText ?? null,
                ctaLink: data.ctaLink ?? null,
                imageUrl: data.imageUrl,
                imagePublicId: data.imagePublicId ?? null,
                dailyRate: data.dailyRate,
                startDate: parsedStart,
                endDate,
                totalPaid: 0,
            },
        });

        return apiSuccess({ ad }, 201);
    });
}
