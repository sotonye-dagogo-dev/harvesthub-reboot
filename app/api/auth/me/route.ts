/**
 * GET /api/auth/me
 * Get current authenticated user
 */
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                profilePicture: true,
                emailVerified: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get role-specific data
        let roleData = null;
        if (user.role === 'BUYER') {
            roleData = await prisma.buyer.findUnique({
                where: { userId: user.id },
            });
        } else if (user.role === 'VENDOR') {
            roleData = await prisma.vendor.findUnique({
                where: { userId: user.id },
            });
        }

        return NextResponse.json({ user, roleData }, { status: 200 });
    } catch (error) {
        console.error('Get current user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
