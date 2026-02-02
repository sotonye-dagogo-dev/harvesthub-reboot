/**
 * GET /api/auth/me
 * 
 * Get current authenticated user
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { userDb, buyerDb, vendorDb } from '@/lib/data/database';

export async function GET() {
    try {
        // Get current user from token
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get full user data
        const user = userDb.findById(currentUser.userId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get role-specific data
        let roleData = null;
        if (user.role === 'BUYER') {
            roleData = buyerDb.findByUserId(user.id);
        } else if (user.role === 'VENDOR') {
            roleData = vendorDb.findByUserId(user.id);
        }

        // Return user data (without password)
        return NextResponse.json(
            {
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
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                roleData,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get current user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
