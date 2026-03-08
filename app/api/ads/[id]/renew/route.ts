import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { adDb } from '@/lib/data/adStore';

// POST /api/ads/[id]/renew - Extend an expired ad with a new payment period
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const ad = adDb.findById(id);

        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        // Only the ad owner can renew
        if (ad.userId !== currentUser.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Can only renew expired or rejected ads
        if (!['EXPIRED', 'REJECTED'].includes(ad.status)) {
            return NextResponse.json(
                { error: 'Only expired or rejected ads can be renewed' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { startDate, duration } = body;

        if (!startDate || !duration) {
            return NextResponse.json(
                { error: 'startDate and duration are required' },
                { status: 400 }
            );
        }

        if (typeof duration !== 'number' || duration < 1 || !Number.isInteger(duration)) {
            return NextResponse.json(
                { error: 'duration must be a positive integer (days)' },
                { status: 400 }
            );
        }

        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
            return NextResponse.json(
                { error: 'startDate must be a valid date' },
                { status: 400 }
            );
        }

        const endDate = new Date(parsedStartDate);
        endDate.setDate(endDate.getDate() + duration);

        const renewed = adDb.update(id, {
            startDate: parsedStartDate,
            endDate,
            duration,
            totalCost: ad.dailyRate * duration,
            status: 'PENDING_PAYMENT',
            paymentVerified: false,
            rejectionReason: null,
        });

        return NextResponse.json({ success: true, ad: renewed });
    } catch (error) {
        console.error('Renew ad error:', error);
        return NextResponse.json(
            { error: 'Failed to renew ad' },
            { status: 500 }
        );
    }
}
