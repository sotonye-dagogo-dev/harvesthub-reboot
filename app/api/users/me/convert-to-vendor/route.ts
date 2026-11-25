import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import {
    CAMPUS_LOCATIONS,
    VENDOR_CATEGORIES,
    SERVICE_CATEGORIES,
    SERVICE_LOCATIONS,
    UserRole,
    VendorStatus,
    COMMISSION_RATES,
} from '@/lib/constants';
import type {
    Prisma,
    Campus as PrismaCampus,
    VendorCategory as PrismaVendorCategory,
    ServiceCategory as PrismaServiceCategory,
    ServiceLocation as PrismaServiceLocation,
} from '@/prisma/generated/client';
import { generateTokenPair } from '@/lib/utils/jwt';
import { setAuthCookies } from '@/lib/utils/cookies';
import {
    checkVerificationDocuments,
    checkVettingDetails,
    normalizeSellerType,
} from '@/lib/services/vendorVerification';
import { isVendorBlocked, vendorBlockedMessage } from '@/lib/services/vendorStatus';

const validCampusValues = new Set(CAMPUS_LOCATIONS.map((item) => item.value));
const validCategoryValues = new Set(VENDOR_CATEGORIES.map((item) => item.value));
const validServiceCategoryValues: Set<string> = new Set(SERVICE_CATEGORIES.map((item) => String(item.value)));
const validServiceLocationValues: Set<string> = new Set(SERVICE_LOCATIONS.map((item) => String(item.value)));

type ConvertToVendorBody = {
    storeName?: string;
    storeDescription?: string;
    category?: string;
    campus?: string;
    whatsappNumber?: string;
    isChurchAffiliated?: boolean;
    serviceCategory?: string;
    serviceLocation?: string;
    businessAddress?: string;
    sellerType?: string;
    idType?: string;
    verificationDocuments?: unknown;
    department?: string;
    refereeName?: string;
    refereePhone?: string;
    chosenPackageId?: string;
};

class ConvertBlockedError extends Error {}

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
        const serviceCategory = body.serviceCategory?.trim() || '';
        const serviceLocation = body.serviceLocation?.trim() || '';

        const businessAddress = body.businessAddress?.trim() || '';

        if (!storeName || !category || !campus || !whatsappNumber || !businessAddress) {
            return NextResponse.json(
                {
                    error:
                        'storeName, category, campus, whatsappNumber and businessAddress are required to register as a vendor.',
                },
                { status: 400 }
            );
        }

        // Same verification rules as new-vendor signup.
        const verification = checkVerificationDocuments({
            sellerType: body.sellerType,
            documents: body.verificationDocuments,
            idType: body.idType,
        });
        if (!verification.ok) {
            return NextResponse.json({ error: verification.error, code: verification.code }, { status: 400 });
        }
        const vetting = checkVettingDetails({
            department: body.department,
            refereeName: body.refereeName,
            refereePhone: body.refereePhone,
        });
        if (!vetting.ok) {
            return NextResponse.json({ error: vetting.error, code: vetting.code }, { status: 400 });
        }

        let chosenPackage: { id: string; slug: string; name: string; price: number; durationDays: number } | null = null;
        if (typeof body.chosenPackageId === 'string' && body.chosenPackageId) {
            const pkg = await prisma.subscriptionPackage.findUnique({
                where: { id: body.chosenPackageId },
                select: { id: true, slug: true, name: true, price: true, durationDays: true, isActive: true },
            });
            if (!pkg || !pkg.isActive || pkg.price <= 0) {
                return NextResponse.json(
                    { error: 'The package you picked is no longer available. Please choose another.', code: 'INVALID_PACKAGE' },
                    { status: 400 }
                );
            }
            chosenPackage = { id: pkg.id, slug: pkg.slug, name: pkg.name, price: pkg.price, durationDays: pkg.durationDays };
        }

        const businessVerification = {
            verificationDocuments: verification.documents,
            businessAddress,
            idType: body.idType || undefined,
            sellerType: normalizeSellerType(body.sellerType),
            department: vetting.details.department,
            referee: { name: vetting.details.refereeName, phone: vetting.details.refereePhone },
            chosenPackage: chosenPackage ? { ...chosenPackage, chosenAt: new Date().toISOString() } : undefined,
        } as unknown as Prisma.InputJsonValue;

        if (!validCategoryValues.has(category as (typeof VENDOR_CATEGORIES)[number]['value'])) {
            return NextResponse.json({ error: 'Invalid vendor category' }, { status: 400 });
        }

        if (!validCampusValues.has(campus as (typeof CAMPUS_LOCATIONS)[number]['value'])) {
            return NextResponse.json({ error: 'Invalid campus value' }, { status: 400 });
        }

        const parsedCategory = category as PrismaVendorCategory;
        const parsedCampus = campus as PrismaCampus;

        if (serviceCategory && !validServiceCategoryValues.has(serviceCategory)) {
            return NextResponse.json({ error: 'Invalid service category' }, { status: 400 });
        }
        if (serviceLocation && !validServiceLocationValues.has(serviceLocation)) {
            return NextResponse.json({ error: 'Invalid service location' }, { status: 400 });
        }
        const parsedServiceCategory = serviceCategory
            ? (serviceCategory as PrismaServiceCategory)
            : null;
        const parsedServiceLocation = serviceLocation
            ? (serviceLocation as PrismaServiceLocation)
            : null;

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

            // A suspended or rejected store must not be reset to PENDING by re-registering.
            if (user.vendor && isVendorBlocked(user.vendor.status)) {
                throw new ConvertBlockedError(vendorBlockedMessage(user.vendor.status));
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

            const categoryCommissionOverride = await tx.commissionConfig.findUnique({
                where: { category: parsedCategory },
                select: { rate: true },
            });
            const defaultTierConfig = await tx.commerceLifecycleConfig.findUnique({
                where: { key: 'default' },
                select: { commissionDefaultRate: true },
            });
            const resolvedCommissionRate =
                categoryCommissionOverride?.rate ??
                defaultTierConfig?.commissionDefaultRate ??
                COMMISSION_RATES.DEFAULT;

            const vendor = await tx.vendor.upsert({
                where: { userId: user.id },
                update: {
                    storeName,
                    storeDescription,
                    category: parsedCategory,
                    campus: parsedCampus,
                    whatsappNumber,
                    isChurchAffiliated,
                    serviceCategory: parsedServiceCategory,
                    serviceLocation: parsedServiceLocation,
                    status: VendorStatus.PENDING,
                    commissionRate: resolvedCommissionRate,
                    businessVerification,
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
                    commissionRate: resolvedCommissionRate,
                    serviceCategory: parsedServiceCategory,
                    serviceLocation: parsedServiceLocation,
                    businessVerification,
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
        if (error instanceof ConvertBlockedError) {
            return NextResponse.json({ error: error.message, code: 'VENDOR_NOT_ACTIVE' }, { status: 403 });
        }
        console.error('POST /api/users/me/convert-to-vendor error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
