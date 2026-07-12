import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { CAMPUS_LOCATIONS, VENDOR_CATEGORIES, UserRole } from '@/lib/constants';
import type { Campus as PrismaCampus, VendorCategory as PrismaVendorCategory } from '@/prisma/generated/client';

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

const validCampusValues = new Set(CAMPUS_LOCATIONS.map((item) => item.value));
const validCategoryValues = new Set(VENDOR_CATEGORIES.map((item) => item.value));

type StoreSettingsPayload = {
    storeName?: string;
    description?: string;
    storeLogo?: string;
    category?: string;
    campus?: string;
    phone?: string;
    whatsapp?: string;
    allowsPickup?: boolean;
    allowsDelivery?: boolean;
    businessHoursStart?: string;
    businessHoursEnd?: string;
    processingTime?: string;
    returnPolicy?: string;
    shippingPolicy?: string;
    businessAddress?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
};

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        if (user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Store settings are only available to vendor users.' }, { status: 403 });
        }

        const vendor = await prisma.vendor.findUnique({
            where: { userId: user.userId },
            include: {
                user: {
                    select: {
                        email: true,
                        phoneNumber: true,
                    },
                },
            },
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
        }

        const settings = asRecord(vendor.storeSettings);
        const policies = asRecord(settings.policies);
        const verification = asRecord(vendor.businessVerification);
        const bankDetails = asRecord(verification.bankDetails);

        return NextResponse.json({
            success: true,
            vendorId: vendor.id,
            settings: {
                storeName: vendor.storeName,
                description: vendor.storeDescription || '',
                storeLogo: vendor.storeLogo || '',
                category: vendor.category,
                campus: vendor.campus,
                isChurchAffiliated: vendor.isChurchAffiliated,
                commissionRate: vendor.commissionRate,
                email: vendor.user.email,
                phone: (settings.contactPhone as string) || vendor.user.phoneNumber || '',
                whatsapp: vendor.whatsappNumber || '',
                allowsPickup: Boolean(settings.allowsPickup),
                allowsDelivery: Boolean(settings.allowsDelivery),
                businessHoursStart: (settings.businessHoursStart as string) || '09:00',
                businessHoursEnd: (settings.businessHoursEnd as string) || '18:00',
                processingTime: (settings.processingTime as string) || '1-2 days',
                returnPolicy: (policies.returnPolicy as string) || '',
                shippingPolicy: (policies.shippingPolicy as string) || '',
                businessAddress: (verification.businessAddress as string) || '',
                bankName: (bankDetails.bankName as string) || '',
                accountName: (bankDetails.accountName as string) || '',
                accountNumber: (bankDetails.accountNumber as string) || '',
            },
        });
    } catch (error) {
        console.error('GET /api/vendors/me/store-settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        if (user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: 'Store settings are only available to vendor users.' }, { status: 403 });
        }

        const body = (await req.json()) as StoreSettingsPayload;

        const storeName = body.storeName?.trim();
        const description = body.description?.trim() || '';
        const storeLogo = body.storeLogo?.trim() || '';
        const category = body.category;
        const campus = body.campus;
        const phone = body.phone?.trim() || '';
        const whatsapp = body.whatsapp?.trim() || '';
        const businessAddress = body.businessAddress?.trim() || '';
        const bankName = body.bankName?.trim() || '';
        const accountName = body.accountName?.trim() || '';
        const accountNumber = body.accountNumber?.trim() || '';

        if (!storeName || !category || !campus || !whatsapp || !businessAddress) {
            return NextResponse.json(
                { error: 'storeName, category, campus, whatsapp, and businessAddress are required.' },
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

        const existingVendor = await prisma.vendor.findUnique({ where: { userId: user.userId } });
        if (!existingVendor) {
            return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
        }

        const existingSettings = asRecord(existingVendor.storeSettings);
        const existingPolicies = asRecord(existingSettings.policies);
        const existingVerification = asRecord(existingVendor.businessVerification);
        const existingBankDetails = asRecord(existingVerification.bankDetails);

        const mergedSettings = {
            ...existingSettings,
            allowsPickup: Boolean(body.allowsPickup),
            allowsDelivery: Boolean(body.allowsDelivery),
            businessHoursStart: body.businessHoursStart || '09:00',
            businessHoursEnd: body.businessHoursEnd || '18:00',
            processingTime: body.processingTime || '1-2 days',
            contactPhone: phone,
            policies: {
                ...existingPolicies,
                returnPolicy: body.returnPolicy || '',
                shippingPolicy: body.shippingPolicy || '',
            },
        };

        const updated = await prisma.$transaction(async (tx) => {
            const updatedVendor = await tx.vendor.update({
                where: { id: existingVendor.id },
                data: {
                    storeName,
                    storeDescription: description,
                    storeLogo: storeLogo || null,
                    category: parsedCategory,
                    campus: parsedCampus,
                    whatsappNumber: whatsapp,
                    businessVerification: {
                        ...existingVerification,
                        businessAddress,
                        bankDetails: {
                            ...existingBankDetails,
                            ...(bankName || accountName || accountNumber
                                ? {
                                      bankName: bankName || existingBankDetails.bankName || undefined,
                                      accountName:
                                          accountName || existingBankDetails.accountName || undefined,
                                      accountNumber:
                                          accountNumber ||
                                          existingBankDetails.accountNumber ||
                                          undefined,
                                  }
                                : undefined),
                        },
                    },
                    storeSettings: mergedSettings,
                },
            });

            if (phone) {
                await tx.user.update({
                    where: { id: user.userId },
                    data: {
                        phoneNumber: phone,
                    },
                });
            }

            return updatedVendor;
        });

        const settings = asRecord(updated.storeSettings);
        const policies = asRecord(settings.policies);
        const updatedVerification = asRecord(updated.businessVerification);
        const updatedBankDetails = asRecord(updatedVerification.bankDetails);

        return NextResponse.json({
            success: true,
            vendorId: updated.id,
            settings: {
                storeName: updated.storeName,
                description: updated.storeDescription || '',
                storeLogo: updated.storeLogo || '',
                category: updated.category,
                campus: updated.campus,
                isChurchAffiliated: updated.isChurchAffiliated,
                commissionRate: updated.commissionRate,
                phone,
                whatsapp: updated.whatsappNumber || '',
                allowsPickup: Boolean(settings.allowsPickup),
                allowsDelivery: Boolean(settings.allowsDelivery),
                businessHoursStart: (settings.businessHoursStart as string) || '09:00',
                businessHoursEnd: (settings.businessHoursEnd as string) || '18:00',
                processingTime: (settings.processingTime as string) || '1-2 days',
                returnPolicy: (policies.returnPolicy as string) || '',
                shippingPolicy: (policies.shippingPolicy as string) || '',
                businessAddress,
                bankName: (updatedBankDetails.bankName as string) || '',
                accountName: (updatedBankDetails.accountName as string) || '',
                accountNumber: (updatedBankDetails.accountNumber as string) || '',
            },
        });
    } catch (error) {
        console.error('PUT /api/vendors/me/store-settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
