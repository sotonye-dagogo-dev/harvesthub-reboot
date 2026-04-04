import { NextRequest } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { z } from 'zod';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { estimateAdAmount, isPaymentSufficient, normalizeAdDuration } from '@/lib/utils/adPricing';

const adApplicationStatusSchema = z.enum([
    'PENDING',
    'PENDING_PAYMENT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
    'EXPIRED',
]);

const createAdApplicationSchema = z.object({
    userId: z.string().optional().nullable(),
    name: z.string().trim().min(2, 'Name is required'),
    email: z.string().trim().email('A valid email is required'),
    phoneNumber: z.string().trim().min(7, 'Phone number is required'),
    companyName: z.string().trim().optional().nullable(),
    title: z.string().trim().min(2, 'Title is required'),
    description: z.string().trim().min(5, 'Description is required'),
    imageUrl: z.string().trim().url('A valid image URL is required'),
    linkUrl: z.string().trim().url().optional().nullable(),
    position: z.enum(['TOP', 'HERO', 'SIDEBAR']).optional(),
    theme: z.enum(['BUSINESS', 'CHURCH', 'EVENT', 'PROMOTION']).optional(),
    requestedStart: z.string().datetime().optional(),
    requestedEnd: z.string().datetime().optional().nullable(),
    paymentMethod: z.enum(['BANK_TRANSFER', 'CARD', 'USSD']),
    amountPaid: z.coerce.number().positive('Amount paid must be greater than zero'),
    proofOfTransferUrl: z.string().trim().url('A valid proof of payment URL is required'),
    durationType: z.enum(['HOURLY', 'DAILY']).optional(),
    durationValue: z.coerce.number().int().min(1).optional(),
});

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/ad-applications', async () => {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return apiError('Unauthorized', 403);
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const searchParams = new URL(req.url).searchParams;
        const rawStatus = searchParams.get('status');

        let status: string | undefined = undefined;
        if (rawStatus) {
            const parsedStatus = adApplicationStatusSchema.safeParse(rawStatus.toUpperCase());
            if (!parsedStatus.success) {
                return apiError('Invalid status filter', 400);
            }
            status = parsedStatus.data;
        }

        let applications;
        try {
            applications = await db.adApplications.findAll({ status });
        } catch (innerError) {
            console.error('GET /api/ad-applications database error:', innerError);
            // If database access fails, return a safe empty response for admin UIs.
            return apiError('Failed to fetch ad applications (database error)', 500);
        }

        return apiSuccess({ applications });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/ad-applications', async () => {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const parsedBody = createAdApplicationSchema.safeParse(await req.json());
        if (!parsedBody.success) {
            return apiError('Invalid request payload', 400, {
                details: parsedBody.error.flatten(),
            });
        }

        const data = parsedBody.data;
        const rateConfig = await db.adRateConfig.getActive();
        if (!rateConfig) {
            return apiError('Ad pricing is unavailable. Please try again later.', 503);
        }

        const normalizedDuration = normalizeAdDuration(data.durationType, data.durationValue);
        const expectedAmount = estimateAdAmount(
            {
                hourlyRate: rateConfig.hourlyRate,
                dailyRate: rateConfig.dailyRate,
            },
            normalizedDuration.durationType,
            normalizedDuration.durationValue
        );

        if (!isPaymentSufficient(data.amountPaid, expectedAmount)) {
            return apiError('Amount paid is below the required rate for selected duration', 400, {
                expectedAmount,
                amountPaid: data.amountPaid,
                durationType: normalizedDuration.durationType,
                durationValue: normalizedDuration.durationValue,
            });
        }

        const application = await db.adApplications.create({
            userId: data.userId ?? null,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            companyName: data.companyName ?? null,
            title: data.title,
            description: data.description,
            imageUrl: data.imageUrl,
            linkUrl: data.linkUrl ?? null,
            position: data.position ?? 'TOP',
            theme: data.theme ?? 'BUSINESS',
            requestedStart: data.requestedStart ? new Date(data.requestedStart) : new Date(),
            requestedEnd: data.requestedEnd ? new Date(data.requestedEnd) : null,
            status: 'PENDING_PAYMENT',
            paymentMethod: data.paymentMethod,
            amountPaid: data.amountPaid,
            proofOfTransferUrl: data.proofOfTransferUrl,
            durationType: normalizedDuration.durationType,
            durationValue: normalizedDuration.durationValue,
            reviewComment: null,
            reviewedBy: null,
            activeUntil: null,
        });

        return apiSuccess({ application, expectedAmount }, 201);
    });
}
