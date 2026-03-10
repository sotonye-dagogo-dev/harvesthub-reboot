/**
 * PUT /api/users/[id]/password � Change password
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitStrict, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import bcrypt from 'bcryptjs';

interface RouteContext { params: Promise<{ id: string }>; }

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitStrict(`password:${user.userId}`);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        if (user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { currentPassword, newPassword } = await req.json();
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const found = await prisma.user.findUnique({ where: { id } });
        if (!found) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const valid = await bcrypt.compare(currentPassword, found.password);
        if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

        const hashed = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({ where: { id }, data: { password: hashed } });

        return NextResponse.json({ success: true, message: 'Password updated' });
    } catch (error) {
        console.error('PUT /api/users/[id]/password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
