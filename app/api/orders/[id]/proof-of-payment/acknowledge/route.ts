import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { Prisma, PaymentStatus, ProofOfTransferStatus } from '@/prisma/generated/client';

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

        const vendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (user.role !== UserRole.ADMIN && order.vendorId !== vendor?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { proofId, action, notes } = body;

        if (!proofId || typeof proofId !== 'string') {
            return NextResponse.json({ error: 'proofId is required' }, { status: 400 });
        }

        if (action !== 'VERIFIED' && action !== 'REJECTED') {
            return NextResponse.json({ error: 'action must be VERIFIED or REJECTED' }, { status: 400 });
        }

        const proof = await prisma.proofOfTransfer.findUnique({ where: { id: proofId } });
        if (!proof || proof.orderId !== order.id) {
            return NextResponse.json({ error: 'Proof of payment not found for this order' }, { status: 404 });
        }

        if (proof.status !== 'PENDING') {
            return NextResponse.json({ error: 'This proof has already been processed' }, { status: 400 });
        }

        const updatedProof = await prisma.proofOfTransfer.update({
            where: { id: proofId },
            data: {
                status: action as ProofOfTransferStatus,
                verifiedBy: user.userId,
                verifiedAt: new Date(),
                notes: typeof notes === 'string' ? notes.trim() : proof.notes,
            },
        });

        if (action === 'VERIFIED') {
            const statusHistory = (order.statusHistory as Array<Record<string, unknown>>) || [];
            statusHistory.push({
                status: 'PAYMENT_VERIFIED',
                timestamp: new Date().toISOString(),
                note: 'Payment verified via proof of payment acknowledgment by vendor',
                verifiedBy: user.userId,
            });

            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    statusHistory: statusHistory as Prisma.InputJsonValue,
                },
            });
        }

        return NextResponse.json({ success: true, proof: updatedProof });
    } catch (error) {
        console.error('POST /api/orders/[id]/proof-of-payment/acknowledge error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
