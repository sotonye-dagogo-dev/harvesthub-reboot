import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/schemas/auth.schemas';
import { db } from '@/lib/data/database';
import { generateId } from '@/lib/utils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate request body
        const validation = forgotPasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: validation.error.errors[0]?.message || 'Invalid input',
                },
                { status: 400 }
            );
        }

        const { email } = validation.data;

        // Check if user exists
        const user = await db.users.findByEmail(email);

        // For security, always return success even if email doesn't exist
        // This prevents user enumeration attacks
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'If an account with that email exists, we sent a password reset link.',
            });
        }

        // Generate reset token (6-character random code for mock)
        const resetToken = generateId(6).toUpperCase();

        // In production, this would:
        // 1. Store token in database with expiry (e.g., 1 hour)
        // 2. Send email with reset link containing token
        // For mock backend, we'll just log it
        console.log(`[MOCK] Password reset token for ${email}: ${resetToken}`);
        console.log(`[MOCK] Reset link: http://localhost:3000/reset-password?token=${resetToken}&email=${email}`);

        // Store token in user record (mock implementation)
        await db.users.update(user.id, {
            resetToken,
            resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        });

        return NextResponse.json({
            success: true,
            message: 'If an account with that email exists, we sent a password reset link.',
            // In development, return token for testing
            ...(process.env.NODE_ENV === 'development' && { token: resetToken }),
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'An error occurred while processing your request.',
            },
            { status: 500 }
        );
    }
}
