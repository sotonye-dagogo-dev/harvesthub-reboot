/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
import { NextResponse } from 'next/server';
import {
    getRefreshToken,
    getRememberMePreference,
    setAccessTokenCookieWithPreference,
} from '@/lib/utils/cookies';
import { verifyRefreshToken, generateAccessToken } from '@/lib/utils/jwt';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@/lib/constants';

export async function POST() {
    try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 401 }
            );
        }

        const newAccessToken = await generateAccessToken(user.id, user.email, user.role as UserRole);
        const rememberMe = await getRememberMePreference();
        await setAccessTokenCookieWithPreference(newAccessToken, rememberMe);

        return NextResponse.json(
            { message: 'Token refreshed successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
