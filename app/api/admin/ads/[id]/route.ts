import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { adDb } from '@/lib/data/adStore';

// PATCH /api/admin/ads/[id] - Admin approve/reject ad, verify payment
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const ad = adDb.findById(id);

        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        const body = await request.json();
        const { action, rejectionReason } = body;

        if (!action || !['approve', 'reject', 'verify_payment', 'pause', 'resume'].includes(action)) {
            return NextResponse.json(
                { error: 'action must be one of: approve, reject, verify_payment, pause, resume' },
                { status: 400 }
            );
        }

        let updated;

        switch (action) {
            case 'approve':
                if (ad.status !== 'PENDING_APPROVAL') {
                    return NextResponse.json(
                        { error: 'Only ads pending approval can be approved' },
                        { status: 400 }
                    );
                }
                updated = adDb.update(id, { status: 'ACTIVE' });
                break;

            case 'reject':
                if (ad.status !== 'PENDING_APPROVAL') {
                    return NextResponse.json(
                        { error: 'Only ads pending approval can be rejected' },
                        { status: 400 }
                    );
                }
                if (!rejectionReason) {
                    return NextResponse.json(
                        { error: 'rejectionReason is required when rejecting an ad' },
                        { status: 400 }
                    );
                }
                updated = adDb.update(id, {
                    status: 'REJECTED',
                    rejectionReason,
                });
                break;

            case 'verify_payment':
                if (ad.status !== 'PENDING_PAYMENT') {
                    return NextResponse.json(
                        { error: 'Only ads pending payment can have payment verified' },
                        { status: 400 }
                    );
                }
                updated = adDb.update(id, {
                    paymentVerified: true,
                    status: 'PENDING_APPROVAL',
                });
                break;

            case 'pause':
                if (ad.status !== 'ACTIVE') {
                    return NextResponse.json(
                        { error: 'Only active ads can be paused' },
                        { status: 400 }
                    );
                }
                updated = adDb.update(id, { status: 'PAUSED' });
                break;

            case 'resume':
                if (ad.status !== 'PAUSED') {
                    return NextResponse.json(
                        { error: 'Only paused ads can be resumed' },
                        { status: 400 }
                    );
                }
                updated = adDb.update(id, { status: 'ACTIVE' });
                break;
        }

        return NextResponse.json({ success: true, ad: updated });
    } catch (error) {
        console.error('Admin update ad error:', error);
        return NextResponse.json(
            { error: 'Failed to update ad' },
            { status: 500 }
        );
    }
}
