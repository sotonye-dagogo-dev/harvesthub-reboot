import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import {
    CAMPUS_LOCATIONS,
    VENDOR_CATEGORIES,
    UserRole,
    VendorStatus,
    COMMISSION_RATES,
} from '@/lib/constants';
import type { Campus as PrismaCampus, VendorCategory as PrismaVendorCategory } from '@/prisma/generated/client';
import { generateTokenPair } from '@/lib/utils/jwt';
import { setAuthCookies } from '@/lib/utils/cookies';

const validCampusValues = new Set(CAMPUS_LOCATIONS.map((item) => item.value));
const validCategoryValues = new Set(VENDOR_CATEGORIES.map((item) => item.value));

type ConvertToVendorBody = {
    storeName?: string;
    storeDescription?: string;
    category?: string;
    campus?: string;
    whatsappNumber?: string;
    isChurchAffiliated?: boolean;
};

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rl = await rateLimitByUser(currentUser.userId, { limit: 20, window: 300 });
        if (!rl.success) return getRateLimitResponse(rl);

        const body = (await req.json()) as ConvertToVendorBody;
        const storeName = body.storeName?.trim();
        const storeDescription = body.storeDescription?.trim() || '';
        const category = body.category;
        const campus = body.campus;
        const whatsappNumber = body.whatsappNumber?.trim();
        const isChurchAffiliated = Boolean(body.isChurchAffiliated);

        if (!storeName || !category || !campus || !whatsappNumber) {
            return NextResponse.json(
                {
                    error:
                        'storeName, category, campus, and whatsappNumber are required to register as a vendor.',
                },
                { status: 400 }
            );
        }

        if (!validCategoryValues.has(category as (typeof VENDOR_CATEGORIES)[number]['value'])) {
            return NextResponse.json({ error: 'Invalid vendor category' }, { status: 400 });
        }

        if (!validCampusValues.has(campus as (typeof CAMPUS_LOCATIONS)[number]['value'])) {
            return NextResponse.json({ error: 'Invalid campus value' }, { status: 400 });
        }

        const parsedCategory = category as PrismaVendorCategory;
        const parsedCampus = campus as PrismaCampus;

        if (currentUser.role === UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin accounts cannot be converted to vendor via this endpoint.' },
                { status: 403 }
            );
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: currentUser.userId },
                select: {
                    id: true,
                    email: true,
                    emailVerified: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    isActive: true,
                    profilePicture: true,
                    vendor: { select: { id: true, status: true } },
                },
            });

            if (!user) {
                throw new Error('User not found');
            }

            if (user.role === UserRole.VENDOR && user.vendor) {
                return {
                    user,
                    vendor: user.vendor,
                    alreadyVendor: true,
                };
            }

            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: { role: UserRole.VENDOR },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    role: true,
                    profilePicture: true,
                    emailVerified: true,
                    isActive: true,
                },
            });

            const vendor = await tx.vendor.upsert({
                where: { userId: user.id },
                update: {
                    storeName,
                    storeDescription,
                    category: parsedCategory,
                    campus: parsedCampus,
                    whatsappNumber,
                    isChurchAffiliated,
                    status: VendorStatus.PENDING,
                    commissionRate: COMMISSION_RATES.DEFAULT,
                },
                create: {
                    userId: user.id,
                    storeName,
                    storeDescription,
                    category: parsedCategory,
                    campus: parsedCampus,
                    whatsappNumber,
                    isChurchAffiliated,
                    status: VendorStatus.PENDING,
                    commissionRate: COMMISSION_RATES.DEFAULT,
                    storeSettings: {
                        allowsPickup: true,
                        allowsDelivery: false,
                        pickupServices: [],
                        deliveryZones: [],
                        policies: {
                            returnPolicy: '',
                            shippingPolicy: '',
                        },
                    },
                },
                select: {
                    id: true,
                    userId: true,
                    storeName: true,
                    status: true,
                    category: true,
                    campus: true,
                },
            });

            return {
                user: updatedUser,
                vendor,
                alreadyVendor: false,
            };
        });

        const tokenSourceUser = result.user;
        const { accessToken, refreshToken } = await generateTokenPair(
            tokenSourceUser.id,
            tokenSourceUser.email,
            UserRole.VENDOR,
            tokenSourceUser.emailVerified
        );
        await setAuthCookies(accessToken, refreshToken);

        return NextResponse.json(
            {
                success: true,
                message: result.alreadyVendor
                    ? 'Your vendor account is already active. Redirecting to your dashboard.'
                    : 'Store registration submitted successfully. You now have vendor access.',
                user: result.user,
                vendor: result.vendor,
                redirectPath: '/operations/dashboard',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('POST /api/users/me/convert-to-vendor error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
