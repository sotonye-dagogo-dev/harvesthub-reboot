/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { clearAuthCookies } from '@/lib/utils/cookies';

function parseEmailChangeToken(token: string): { nextEmail: string; tokenId: string } | null {
    if (!token.startsWith('email-change:')) return null;
    const [, encodedEmail, tokenId] = token.split(':');
    if (!encodedEmail || !tokenId) return null;
    try {
        const nextEmail = Buffer.from(encodedEmail, 'base64url').toString('utf8').trim().toLowerCase();
        if (!nextEmail || !nextEmail.includes('@') || nextEmail.length > 254) return null;
        return { nextEmail, tokenId };
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token } = body;

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Verification token is required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { emailVerificationToken: token },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired verification token.' },
                { status: 400 }
            );
        }

        if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Verification token has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        const emailChangeToken = parseEmailChangeToken(token);

        if (emailChangeToken) {
            const { nextEmail } = emailChangeToken;

            const existing = await prisma.user.findUnique({ where: { email: nextEmail } });
            if (existing && existing.id !== user.id) {
                return NextResponse.json(
                    { success: false, error: 'Email address is already in use by another account.' },
                    { status: 409 }
                );
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    email: nextEmail,
                    emailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpiry: null,
                },
            });

            // Force explicit re-authentication after email mutation so any existing session/token
            // bound to the old email identity cannot continue as if unchanged.
            await clearAuthCookies();

            return NextResponse.json({
                success: true,
                message: 'Email changed and verified successfully. Please log in again.',
                requiresReauth: true,
                redirectTo: '/login?emailChanged=1',
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpiry: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully. You can now log in.',
        });
    } catch (error) {
        console.error('Verify email error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred while verifying your email.' },
            { status: 500 }
        );
    }
}
