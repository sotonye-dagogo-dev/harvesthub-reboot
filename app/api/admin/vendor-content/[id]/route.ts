/**
 * Admin Vendor Content Item API — PUT approve/reject
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { moderateVendorContentSchema } from '@/lib/schemas/vendor-content.schemas';

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { id: contentId } = await context.params;

        const existing = await prisma.vendorContent.findUnique({ where: { id: contentId } });
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
        }

        const body = await req.json();
        const parsed = moderateVendorContentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: 'Validation error', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data: Record<string, unknown> = { status: parsed.data.status };
        if (parsed.data.status === 'REJECTED') {
            data.rejectionReason = parsed.data.rejectionReason || 'Content does not meet platform guidelines';
        } else {
            data.rejectionReason = null;
        }

        const updated = await prisma.vendorContent.update({
            where: { id: contentId },
            data,
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('[AdminVendorContent PUT]', error);
        return NextResponse.json({ success: false, error: 'Failed to moderate content' }, { status: 500 });
    }
}
