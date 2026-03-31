import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const searchParams = new URL(req.url).searchParams;
        const rawStatus = searchParams.get('status');

        const validStatuses = ['PENDING', 'PENDING_PAYMENT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED'];
        let status: string | undefined = undefined;
        if (rawStatus) {
            const normalized = rawStatus.toUpperCase();
            if (!validStatuses.includes(normalized)) {
                return NextResponse.json({ success: false, error: 'Invalid status filter' }, { status: 400 });
            }
            status = normalized;
        }

        let applications;
        try {
            applications = await db.adApplications.findAll({ status });
        } catch (innerError) {
            console.error('GET /api/ad-applications database error:', innerError);
            // If database access fails, return a safe empty response for admin UIs.
            return NextResponse.json({ success: false, error: 'Failed to fetch ad applications (database error)' }, { status: 500 });
        }

        return NextResponse.json({ success: true, applications });
    } catch (error) {
        console.error('GET /api/ad-applications error:', error);
        return NextResponse.json({ error: 'Failed to fetch ad applications' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const {
            userId,
            name,
            email,
            phoneNumber,
            companyName,
            title,
            description,
            imageUrl,
            linkUrl,
            position,
            theme,
            requestedStart,
            requestedEnd,
            paymentMethod,
            amountPaid,
            proofOfTransferUrl,
            durationType,
            durationValue,
        } = body;

        if (!name || !email || !phoneNumber || !title || !description || !imageUrl || !paymentMethod || !amountPaid || !proofOfTransferUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const application = await db.adApplications.create({
            userId: userId ?? null,
            name,
            email,
            phoneNumber,
            companyName: companyName ?? null,
            title,
            description,
            imageUrl,
            linkUrl: linkUrl ?? null,
            position: position ?? 'TOP',
            theme: theme ?? 'BUSINESS',
            requestedStart: requestedStart ? new Date(requestedStart) : new Date(),
            requestedEnd: requestedEnd ? new Date(requestedEnd) : null,
            status: 'PENDING_PAYMENT',
            paymentMethod,
            amountPaid: Number(amountPaid),
            proofOfTransferUrl,
            durationType: durationType ?? 'DAILY',
            durationValue: Number(durationValue ?? 1),
            reviewComment: null,
            reviewedBy: null,
            activeUntil: null,
        });

        return NextResponse.json({ success: true, application }, { status: 201 });
    } catch (error) {
        console.error('POST /api/ad-applications error:', error);
        return NextResponse.json({ error: 'Failed to create ad application' }, { status: 500 });
    }
}
