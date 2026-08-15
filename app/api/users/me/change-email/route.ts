import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/db/prisma';
import { sendVerifyEmail } from '@/lib/services/email';

function parseEmailChangeToken(token: string): { pendingEmail: string } | null {
    if (!token.startsWith('email-change:')) return null;
    const [, encodedEmail] = token.split(':');
    if (!encodedEmail) return null;
    try {
        const pendingEmail = Buffer.from(encodedEmail, 'base64url').toString('utf8').trim().toLowerCase();
        if (!pendingEmail || !pendingEmail.includes('@') || pendingEmail.length > 254) return null;
        return { pendingEmail };
    } catch {
        return null;
    }
}

export async function GET() {
    return withApiHandler('GET /api/users/me/change-email', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const current = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                emailVerificationToken: true,
                emailVerificationExpiry: true,
            },
        });

        if (!current) return apiError('User not found', 404);

        const token = current.emailVerificationToken;
        const parsed = token ? parseEmailChangeToken(token) : null;

        if (!parsed || !current.emailVerificationExpiry || current.emailVerificationExpiry < new Date()) {
            return apiSuccess({
                hasPendingEmailChange: false,
                pendingEmail: null,
                expiresAt: null,
            });
        }

        return apiSuccess({
            hasPendingEmailChange: true,
            pendingEmail: parsed.pendingEmail,
            expiresAt: current.emailVerificationExpiry.toISOString(),
        });
    });
}

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
                emailVerificationToken: token,
                emailVerificationExpiry: expiresAt,
            },
        });

        const sendResult = await sendVerifyEmail(newEmail, current.firstName, token);

        if (!sendResult.success) {
            console.error(
                `[ChangeEmail] Verification email failed for user ${current.id} -> ${newEmail.slice(0, 3)}***:`,
                sendResult.error
            );
            return apiError(
                "We couldn't send the verification link right now. Please try again in a few minutes.",
                502
            );
        }

        return apiSuccess({
            message: 'Verification link sent to your new email address.',
            pendingEmail: newEmail,
        });
    });
}
