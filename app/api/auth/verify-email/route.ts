import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/database';

// POST /api/auth/verify-email - Verify email with token
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

        // Find user with this verification token
        const allUsers = db.users.findAll();
        const user = allUsers.find(
            (u) => u.emailVerificationToken === token
        );

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Invalid or expired verification token.' },
                { status: 400 }
            );
        }

        // Check token expiry
        if (
            user.emailVerificationExpiry &&
            new Date(user.emailVerificationExpiry) < new Date()
        ) {
            return NextResponse.json(
                { success: false, error: 'Verification token has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Mark email as verified and clear verification fields
        db.users.update(user.id, {
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpiry: null,
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
