import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { availabilityRequestDb } from '@/lib/data/availabilityRequestStore';

// GET /api/availability-requests - List availability requests for the authenticated user
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = db.users.findById(currentUser.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let requests;

        if (user.role === UserRole.BUYER) {
            const buyer = db.buyers.findByUserId(user.id);
            if (!buyer) {
                return NextResponse.json({ success: true, requests: [] });
            }
            requests = availabilityRequestDb.findByBuyerId(buyer.id);
        } else if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(user.id);
            if (!vendor) {
                return NextResponse.json({ success: true, requests: [] });
            }
            requests = availabilityRequestDb.findByVendorId(vendor.id);
        } else if (user.role === UserRole.ADMIN) {
            requests = availabilityRequestDb.findAll();
        } else {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Enrich with vendor/buyer info
        const enrichedRequests = requests.map((req) => {
            const vendor = db.vendors.findById(req.vendorId);
            const buyer = db.buyers.findById(req.buyerId);
            const buyerUser = buyer ? db.users.findById(buyer.userId) : undefined;
            return {
                ...req,
                vendorName: vendor?.storeName ?? 'Unknown Store',
                buyerName: buyerUser
                    ? `${buyerUser.firstName} ${buyerUser.lastName}`
                    : 'Unknown Buyer',
            };
        });

        return NextResponse.json({ success: true, requests: enrichedRequests });
    } catch (error) {
        console.error('Get availability requests error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch availability requests' },
            { status: 500 }
        );
    }
}

// POST /api/availability-requests - Create availability request (buyer only)
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = db.users.findById(currentUser.userId);
        if (!user || user.role !== UserRole.BUYER) {
            return NextResponse.json(
                { error: 'Only buyers can create availability requests' },
                { status: 403 }
            );
        }

        const buyer = db.buyers.findByUserId(user.id);
        if (!buyer) {
            return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 });
        }

        const body = await request.json();
        const { vendorId, items, buyerNote } = body;

        if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'vendorId and items are required' },
                { status: 400 }
            );
        }

        // Validate vendor exists
        const vendor = db.vendors.findById(vendorId);
        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        // Validate each item has required fields
        for (const item of items) {
            if (!item.productId || !item.quantity || !item.productName) {
                return NextResponse.json(
                    { error: 'Each item must have productId, quantity, and productName' },
                    { status: 400 }
                );
            }
        }

        const availabilityRequest = availabilityRequestDb.create({
            buyerId: buyer.id,
            vendorId,
            items,
            buyerNote: buyerNote ?? null,
        });

        return NextResponse.json(
            { success: true, request: availabilityRequest },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create availability request error:', error);
        return NextResponse.json(
            { error: 'Failed to create availability request' },
            { status: 500 }
        );
    }
}
