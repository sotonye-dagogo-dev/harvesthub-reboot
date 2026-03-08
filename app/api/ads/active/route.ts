import { NextResponse } from 'next/server';
import { adDb } from '@/lib/data/adStore';

// GET /api/ads/active - Public route: returns active ads for display rotation
export async function GET() {
    try {
        const activeAds = adDb.findActive();

        // Increment impressions for returned ads
        for (const ad of activeAds) {
            adDb.update(ad.id, { impressions: ad.impressions + 1 });
        }

        // Return only the public-facing fields
        const publicAds = activeAds.map((ad) => ({
            id: ad.id,
            title: ad.title,
            subtitle: ad.subtitle,
            ctaText: ad.ctaText,
            ctaLink: ad.ctaLink,
            imageUrl: ad.imageUrl,
        }));

        return NextResponse.json({ success: true, ads: publicAds });
    } catch (error) {
        console.error('Get active ads error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch active ads' },
            { status: 500 }
        );
    }
}
