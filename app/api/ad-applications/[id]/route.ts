import { NextRequest } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { z } from 'zod';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import {
    computeAdActiveUntil,
    estimateAdAmount,
    isPaymentSufficient,
    normalizeAdDuration,
} from '@/lib/utils/adPricing';

const updateAdApplicationSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    reviewComment: z.string().trim().max(1000).optional().nullable(),
    createBanner: z.boolean().optional(),
    durationType: z.enum(['HOURLY', 'DAILY']).optional(),
    durationValue: z.coerce.number().int().min(1).optional(),
});

export async function PATCH(req: NextRequest, context: any) {
    return withApiHandler('PATCH /api/ad-applications/[id]', async () => {
        const params = context?.params;
        const id = params?.id;
        if (!id) {
            return apiError('Invalid id', 400);
        }

        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return apiError('Unauthorized', 403);
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const parsedBody = updateAdApplicationSchema.safeParse(await req.json());
        if (!parsedBody.success) {
            return apiError('Invalid request payload', 400, {
                details: parsedBody.error.flatten(),
            });
        }

        const { status, reviewComment, createBanner, durationType, durationValue } = parsedBody.data;

        const existingApplication = await db.adApplications.findById(id);
        if (!existingApplication) {
            return apiError('Application not found', 404);
        }

        const updatePayload: Record<string, unknown> = {
            status,
            reviewComment: reviewComment ?? null,
            reviewedBy: user.userId,
        };

        let expectedAmount: number | null = null;

        if (status === 'APPROVED') {
            const rateConfig = await db.adRateConfig.getActive();
            if (!rateConfig) {
                return apiError('No active ad rate config found', 503);
            }

            const normalizedDuration = normalizeAdDuration(
                durationType ?? existingApplication.durationType,
                durationValue ?? existingApplication.durationValue
            );

            expectedAmount = estimateAdAmount(
                {
                    hourlyRate: rateConfig.hourlyRate,
                    dailyRate: rateConfig.dailyRate,
                },
                normalizedDuration.durationType,
                normalizedDuration.durationValue
            );

            if (!isPaymentSufficient(existingApplication.amountPaid ?? 0, expectedAmount)) {
                return apiError('Application payment is below configured rate for selected duration', 400, {
                    expectedAmount,
                    amountPaid: existingApplication.amountPaid ?? 0,
                    durationType: normalizedDuration.durationType,
                    durationValue: normalizedDuration.durationValue,
                });
            }

            const activeUntil = computeAdActiveUntil(
                new Date(existingApplication.requestedStart),
                normalizedDuration.durationType,
                normalizedDuration.durationValue
            );

            updatePayload.durationType = normalizedDuration.durationType;
            updatePayload.durationValue = normalizedDuration.durationValue;
            updatePayload.activeUntil = activeUntil;

            if (createBanner) {
                updatePayload.status = 'ACTIVE';
            }
        }

        const application = await db.adApplications.update(id, updatePayload);

        if (!application) {
            return apiError('Application not found', 404);
        }

        let banner = null;
        if (createBanner && status === 'APPROVED') {
            banner = await db.banners.create({
                title: application.title,
                subtitle: application.companyName || application.email,
                description: application.description,
                imageUrl: application.imageUrl,
                linkUrl: application.linkUrl,
                position: application.position,
                theme: application.theme || 'BUSINESS',
                isActive: true,
                startDate: application.requestedStart,
                endDate: application.activeUntil || application.requestedEnd || null,
                displayOrder: 0,
                targetAudience: [],
                clickCount: 0,
                impressionCount: 0,
                createdBy: user.userId,
            });
        }

        return apiSuccess({ application, banner, expectedAmount });
    });
}
