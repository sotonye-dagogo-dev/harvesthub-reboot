/**
 * POST /api/auth/reset-password
 * Reset password using token from email
 */
import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/schemas/auth.schemas';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/utils/password';
import { rateLimitStrict, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const rl = await rateLimitStrict(`reset:${ip}`);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const validation = resetPasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.errors[0]?.message || 'Invalid input' },
                { status: 400 }
            );
        }

        const { email, token, password } = validation.data;

        const user = await prisma.user.findUnique({
            where: { resetToken: token },
        });

        if (!user || user.email !== email.toLowerCase().trim()) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired reset token.' },
                { status: 400 }
            );
        }

        if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Reset token has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        const hashedPassword = await hashPassword(password);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred while resetting your password.' },
            { status: 500 }
        );
    }
}
