import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { availabilityRequestDb } from '@/lib/data/availabilityRequestStore';

// GET /api/availability-requests/[id] - Get single availability request
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const availabilityRequest = availabilityRequestDb.findById(id);

        if (!availabilityRequest) {
            return NextResponse.json({ error: 'Availability request not found' }, { status: 404 });
        }

        const user = db.users.findById(currentUser.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Authorization: only the buyer, the vendor, or an admin can view
        if (user.role === UserRole.BUYER) {
            const buyer = db.buyers.findByUserId(user.id);
            if (!buyer || buyer.id !== availabilityRequest.buyerId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(user.id);
            if (!vendor || vendor.id !== availabilityRequest.vendorId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Enrich with names
        const vendor = db.vendors.findById(availabilityRequest.vendorId);
        const buyer = db.buyers.findById(availabilityRequest.buyerId);
        const buyerUser = buyer ? db.users.findById(buyer.userId) : undefined;

        return NextResponse.json({
            success: true,
            request: {
                ...availabilityRequest,
                vendorName: vendor?.storeName ?? 'Unknown Store',
                buyerName: buyerUser
                    ? `${buyerUser.firstName} ${buyerUser.lastName}`
                    : 'Unknown Buyer',
            },
        });
    } catch (error) {
        console.error('Get availability request error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch availability request' },
            { status: 500 }
        );
    }
}

// PATCH /api/availability-requests/[id] - Vendor confirms or declines
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = db.users.findById(currentUser.userId);
        if (!user || user.role !== UserRole.VENDOR) {
            return NextResponse.json(
                { error: 'Only vendors can respond to availability requests' },
                { status: 403 }
            );
        }

        const vendor = db.vendors.findByUserId(user.id);
        if (!vendor) {
            return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
        }

        const { id } = await params;
        const availabilityRequest = availabilityRequestDb.findById(id);

        if (!availabilityRequest) {
            return NextResponse.json({ error: 'Availability request not found' }, { status: 404 });
        }

        // Only the addressed vendor can respond
        if (availabilityRequest.vendorId !== vendor.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Cannot respond to already-resolved or expired requests
        if (availabilityRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'This request has already been responded to' },
                { status: 400 }
            );
        }

        if (new Date(availabilityRequest.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: 'This request has expired' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status, vendorResponse } = body;

        if (!status || !['CONFIRMED', 'DECLINED'].includes(status)) {
            return NextResponse.json(
                { error: 'Status must be CONFIRMED or DECLINED' },
                { status: 400 }
            );
        }

        const updated = availabilityRequestDb.updateStatus(id, status, vendorResponse);

        return NextResponse.json({
            success: true,
            request: updated,
        });
    } catch (error) {
        console.error('Update availability request error:', error);
        return NextResponse.json(
            { error: 'Failed to update availability request' },
            { status: 500 }
        );
    }
}
