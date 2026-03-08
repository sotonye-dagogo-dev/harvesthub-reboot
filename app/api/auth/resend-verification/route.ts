import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/database';
import { sendVerifyEmail } from '@/lib/services/email';

// Rate limiting: 3 requests per hour per email (to be enforced in Stream 2)

// POST /api/auth/resend-verification - Resend verification email
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Always return success to prevent user enumeration
        const successResponse = {
            success: true,
            message: 'If an account with that email exists and is not yet verified, we sent a verification email.',
        };

        const user = db.users.findByEmail(email);

        // If user doesn't exist, return success anyway (security)
        if (!user) {
            return NextResponse.json(successResponse);
        }

        // If already verified, no need to resend
        if (user.emailVerified) {
            return NextResponse.json(successResponse);
        }

        // Generate new verification token
        const verificationToken = crypto.randomUUID();
        const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token on user record
        db.users.update(user.id, {
            emailVerificationToken: verificationToken,
            emailVerificationExpiry,
        });

        // Send verification email
        await sendVerifyEmail(user.email, user.firstName, verificationToken);

        console.log(`[EMAIL] Verification email resent to ${user.email}`);

        return NextResponse.json(successResponse);
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred while processing your request.' },
            { status: 500 }
        );
    }
}
