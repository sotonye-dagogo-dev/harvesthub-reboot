/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { clearAuthCookies, setAuthCookies } from '@/lib/utils/cookies';
import { generateTokenPair } from '@/lib/utils/jwt';
import { verifyAccessToken } from '@/lib/utils/jwt';

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
        const { token, email: emailHint } = body as { token?: string; email?: string };

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Verification token is required', code: 'TOKEN_REQUIRED' },
                { status: 400 }
            );
        }

        // Normalize token: trim and decode if URL-encoded (defensive for copy/paste or encoded links)
        let normalizedToken = token.trim();
        try {
            const decoded = decodeURIComponent(normalizedToken);
            // Only use decoded if it changes and looks like a plausible token (prevents double-decode issues)
            if (decoded !== normalizedToken) normalizedToken = decoded.trim();
        } catch {
            // keep raw trimmed token if decode fails
        }

        let user = await prisma.user.findUnique({
            where: { emailVerificationToken: normalizedToken },
        });

        // Fallback: try raw token if normalized lookup failed (covers edge encoding)
        if (!user && normalizedToken !== token.trim()) {
            user = await prisma.user.findUnique({
                where: { emailVerificationToken: token.trim() },
            });
        }

        if (!user) {
            // Helpful branch: if email hint supplied and that account is already verified,
            // tell the client to sign in instead of showing a generic invalid-token error.
            const hintEmail = typeof emailHint === 'string' ? emailHint.trim().toLowerCase() : '';
            if (hintEmail) {
                const hintUser = await prisma.user.findUnique({ where: { email: hintEmail } });
                if (hintUser?.emailVerified) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Your email is already verified. You can sign in now.',
                            code: 'ALREADY_VERIFIED',
                            alreadyVerified: true,
                            redirectTo: '/login?verified=1',
                        },
                        { status: 400 }
                    );
                }
            }
            return NextResponse.json(
                { success: false, error: 'Invalid verification link. It may have already been used or is malformed. Please request a new verification email.', code: 'INVALID_TOKEN' },
                { status: 400 }
            );
        }

        // Already verified but token still present (idempotent retry)
        if (user.emailVerified && !normalizedToken.startsWith('email-change:')) {
            // Clear token so repeated clicks don't keep "invalid" state
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerificationToken: null, emailVerificationExpiry: null },
            });
            return NextResponse.json({
                success: true,
                alreadyVerified: true,
                message: 'Your email is already verified. You can sign in now.',
                redirectTo: '/login?verified=1',
            });
        }

        if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Verification link has expired. Please request a new verification email below.', code: 'TOKEN_EXPIRED' },
                { status: 400 }
            );
        }

        const emailChangeToken = parseEmailChangeToken(normalizedToken);

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

        // If the caller is currently authenticated (stale JWT with emailVerified:false),
        // upgrade their session in-place so middleware stops forcing /verify-email.
        try {
            const accessToken = req.cookies.get('accessToken')?.value;
            if (accessToken) {
                const payload = await verifyAccessToken(accessToken);
                if (payload && payload.userId === user.id) {
                    const { accessToken: newAccess, refreshToken: newRefresh } = await generateTokenPair(user.id, user.email, (payload.role as any), true);
                    const rememberMe = !!req.cookies.get('rememberMe')?.value;
                    await setAuthCookies(newAccess, newRefresh, rememberMe);
                    return NextResponse.json({
                        success: true,
                        message: 'Email verified successfully. You can now continue to your dashboard.',
                        redirectTo: '/login?verified=1',
                        refreshedSession: true,
                    });
                }
            }
        } catch {
            // Non-fatal: verification already succeeded, session refresh is best-effort
        }

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully. You can now log in.',
            redirectTo: '/login?verified=1',
        });
    } catch (error) {
        console.error('Verify email error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred while verifying your email.' },
            { status: 500 }
        );
    }
}
