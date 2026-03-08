import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { adDb } from '@/lib/data/adStore';

// POST /api/ads - Submit a new ad
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            subtitle,
            ctaText,
            ctaLink,
            imageUrl,
            imagePublicId,
            dailyRate,
            startDate,
            duration,
        } = body;

        // Validate required fields
        if (!title || !imageUrl || !dailyRate || !startDate || !duration) {
            return NextResponse.json(
                { error: 'title, imageUrl, dailyRate, startDate, and duration are required' },
                { status: 400 }
            );
        }

        if (typeof dailyRate !== 'number' || dailyRate <= 0) {
            return NextResponse.json(
                { error: 'dailyRate must be a positive number' },
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

        const ad = adDb.create({
            userId: currentUser.userId,
            title,
            subtitle: subtitle ?? null,
            ctaText: ctaText ?? null,
            ctaLink: ctaLink ?? null,
            imageUrl,
            imagePublicId: imagePublicId ?? null,
            dailyRate,
            startDate: parsedStartDate,
            duration,
        });

        return NextResponse.json({ success: true, ad }, { status: 201 });
    } catch (error) {
        console.error('Create ad error:', error);
        return NextResponse.json(
            { error: 'Failed to create ad' },
            { status: 500 }
        );
    }
}
