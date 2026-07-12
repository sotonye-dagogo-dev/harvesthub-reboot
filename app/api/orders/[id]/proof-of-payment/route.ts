import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { Prisma } from '@/prisma/generated/client';

interface RouteContext { params: Promise<{ id: string }>; }

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (user.role !== UserRole.ADMIN && order.buyerId !== buyer?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (order.paymentStatus !== 'PENDING') {
            return NextResponse.json({ error: 'Payment is not pending for this order' }, { status: 400 });
        }

        if (order.paymentMethod !== 'BANK_TRANSFER_PROOF' && order.paymentMethod !== 'BANK_TRANSFER') {
            return NextResponse.json({ error: 'This order does not support proof of payment upload' }, { status: 400 });
        }

        const body = await req.json();
        const { imageUrl, imagePublicId, bankReference, amount, notes } = body;

        if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
            return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 });
        }

        const proof = await prisma.proofOfTransfer.create({
            data: {
                orderId: order.id,
                userId: user.userId,
                imageUrl: imageUrl.trim(),
                imagePublicId: typeof imagePublicId === 'string' ? imagePublicId.trim() : null,
                bankReference: typeof bankReference === 'string' ? bankReference.trim() : null,
                amount,
                status: 'PENDING',
                notes: typeof notes === 'string' ? notes.trim() : null,
            },
        });

        return NextResponse.json({ success: true, proof }, { status: 201 });
    } catch (error) {
        console.error('POST /api/orders/[id]/proof-of-payment error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
