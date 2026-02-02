/**
 * POST /api/auth/logout
 * 
 * Clear authentication cookies
 */

import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/utils/cookies';

export async function POST() {
    try {
        // Clear auth cookies
        await clearAuthCookies();

        return NextResponse.json(
            { message: 'Logout successful' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
