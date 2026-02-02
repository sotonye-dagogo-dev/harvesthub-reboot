import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/schemas/auth.schemas';
import { db } from '@/lib/data/database';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request body
        const validation = resetPasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: validation.error.errors[0]?.message || 'Invalid input',
                },
                { status: 400 }
            );
        }

        const { email, token, password } = validation.data;

        // Find user by email
        const user = await db.users.findByEmail(email);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid or expired reset token.',
                },
                { status: 400 }
            );
        }

        // Verify token matches and hasn't expired
        if (
            !user.resetToken ||
            user.resetToken !== token ||
            !user.resetTokenExpiry ||
            new Date(user.resetTokenExpiry) < new Date()
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid or expired reset token.',
                },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password and clear reset token
        await db.users.update(user.id, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        });

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An error occurred while resetting your password.',
            },
            { status: 500 }
        );
    }
}
