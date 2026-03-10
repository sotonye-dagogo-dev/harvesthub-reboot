/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

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
