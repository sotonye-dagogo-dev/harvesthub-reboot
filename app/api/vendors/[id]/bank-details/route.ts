import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            select: { storeName: true, businessVerification: true },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        const verification = vendor.businessVerification as Record<string, unknown> | null;
        const bankDetails = verification?.bankDetails as Record<string, string> | null;

        if (!bankDetails?.bankName || !bankDetails?.accountName || !bankDetails?.accountNumber) {
            return NextResponse.json({ success: true, bankDetails: null });
        }

        return NextResponse.json({
            success: true,
            vendorName: vendor.storeName,
            bankDetails: {
                bankName: bankDetails.bankName,
                accountName: bankDetails.accountName,
                accountNumber: bankDetails.accountNumber,
            },
        });
    } catch (error) {
        console.error('GET /api/vendors/[id]/bank-details error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
