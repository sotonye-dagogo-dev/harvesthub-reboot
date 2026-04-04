import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/db/prisma';
import { sendVerifyEmail } from '@/lib/services/email';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/users/me/change-email', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId, { limit: 10, window: 3600 });
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const newEmailRaw = typeof body.newEmail === 'string' ? body.newEmail : '';
        const newEmail = newEmailRaw.trim().toLowerCase();
        if (!newEmail || !newEmail.includes('@')) {
            return apiError('Valid newEmail is required', 400);
        }

        const current = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { id: true, email: true, firstName: true },
        });
        if (!current) return apiError('User not found', 404);

        if (current.email.toLowerCase() === newEmail) {
            return apiError('New email must be different from current email', 400);
        }

        const duplicate = await prisma.user.findUnique({ where: { email: newEmail } });
        if (duplicate && duplicate.id !== current.id) {
            return apiError('Email already in use', 409);
        }

        const tokenId = randomUUID();
        const token = `email-change:${Buffer.from(newEmail, 'utf8').toString('base64url')}:${tokenId}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: current.id },
            data: {
                emailVerified: false,
                emailVerificationToken: token,
                emailVerificationExpiry: expiresAt,
            },
        });

        await sendVerifyEmail(newEmail, current.firstName, token);

        return apiSuccess({
            message: 'Verification link sent to your new email address.',
            pendingEmail: newEmail,
        });
    });
}
