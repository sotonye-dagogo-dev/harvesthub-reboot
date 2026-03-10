/**
 * Admin Vendor Content API — GET all content for moderation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'PENDING';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

        const where = status === 'ALL' ? {} : { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED' };

        const [content, total] = await Promise.all([
            prisma.vendorContent.findMany({
                where,
                include: {
                    vendor: {
                        select: { id: true, storeName: true, storeLogo: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.vendorContent.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: content,
            pagination: {
                page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (error) {
        console.error('[AdminVendorContent GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch content' }, { status: 500 });
    }
}
