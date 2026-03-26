import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function PATCH(req: NextRequest, context: any) {
    try {
        const params = context?.params;
        const id = params?.id;
        if (!id) {
            return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
        }

        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { status, reviewComment, createBanner } = body;
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const application = await db.adApplications.update(id, {
            status,
            reviewComment: reviewComment ?? null,
            reviewedBy: user.userId,
        });

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        let banner = null;
        if (createBanner && status === 'APPROVED') {
            banner = await db.banners.create({
                title: application.title,
                subtitle: application.companyName || application.email,
                description: application.description,
                imageUrl: application.imageUrl,
                linkUrl: application.linkUrl,
                position: application.position,
                theme: application.theme || 'BUSINESS',
                isActive: true,
                startDate: application.requestedStart,
                endDate: application.requestedEnd || null,
                displayOrder: 0,
                targetAudience: [],
                clickCount: 0,
                impressionCount: 0,
                createdBy: user.userId,
            });
        }

        return NextResponse.json({ success: true, application, banner });
    } catch (error) {
        console.error('PATCH /api/ad-applications/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update ad application' }, { status: 500 });
    }
}
