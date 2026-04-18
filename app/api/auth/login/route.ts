/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/utils/password';
import { generateTokenPair } from '@/lib/utils/jwt';
import { setAuthCookies } from '@/lib/utils/cookies';
import { rateLimitStrict, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        // Diagnostic: log DB env and Prisma availability for debugging
        // (Helpful when reproducing internal server errors during login)
        // eslint-disable-next-line no-console
        console.debug('DATABASE_URL present:', !!process.env.DATABASE_URL);
        // eslint-disable-next-line no-console
        console.debug('NODE_ENV:', process.env.NODE_ENV);
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const rl = await rateLimitStrict(ip);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await request.json();
        const { email, password, rememberMe } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        let user;
        try {
            user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        } catch (dbErr) {
            // eslint-disable-next-line no-console
            console.error('Prisma query failed in login route:', dbErr);
            return NextResponse.json(
                { error: 'We\u2019re having trouble connecting right now. Please try again in a moment.' },
                { status: 500 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account is inactive. Please contact support.' },
                { status: 403 }
            );
        }

        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        if (!user.emailVerified) {
            return NextResponse.json(
                { error: 'Please verify your email address before logging in', needsEmailVerification: true },
                { status: 403 }
            );
        }

        const { accessToken, refreshToken } = await generateTokenPair(user.id, user.email, user.role as UserRole, user.emailVerified);
        await setAuthCookies(accessToken, refreshToken, !!rememberMe);

        return NextResponse.json(
            {
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    emailVerified: user.emailVerified,
                    isActive: user.isActive,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
