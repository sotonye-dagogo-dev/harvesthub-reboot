/**
 * POST /api/auth/register
 * Register a new user (buyer or vendor)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@/prisma/generated/client';
import { hashPassword } from '@/lib/utils/password';
import { sendVerifyEmail } from '@/lib/services/email';
import { rateLimitStrict, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { CATEGORY_COMMISSION_DEFAULTS, COMMISSION_RATES, VendorCategory, Campus, UserRole, Gender, Position } from '@/lib/constants';
import { randomUUID as uuidv4 } from 'crypto';

const isValidEnumValue = <T extends readonly string[]>(value: unknown, enumValues: T): value is T[number] =>
    typeof value === 'string' && (enumValues as readonly string[]).includes(value);

const isPrismaKnownError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
    Boolean(error && typeof error === 'object' && 'code' in error);

const inferFieldFromPrismaError = (error: Prisma.PrismaClientKnownRequestError): string => {
    const fromTarget = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[]).join(', ')
        : typeof error.meta?.target === 'string'
            ? (error.meta.target as string)
            : '';

    if (fromTarget) return fromTarget;

    const message = error.message.toLowerCase();
    if (message.includes('position')) return 'position';
    if (message.includes('businessverification')) return 'businessVerification';
    if (message.includes('storesettings')) return 'storeSettings';
    if (message.includes('registrationsequence')) return 'registrationSequence';
    if (message.includes('email')) return 'email';
    return 'unknown field';
};

export async function POST(request: NextRequest) {
    let body: any = null;
    const correlationId = request.headers.get('x-correlation-id') || uuidv4();
    const logBase = { route: 'POST /api/auth/register', correlationId };
    const maskEmail = (email: unknown) => {
        if (typeof email !== 'string' || !email.includes('@')) return 'unknown';
        const [name, domain] = email.split('@');
        if (!name || !domain) return 'unknown';
        return `${name.slice(0, 2)}***@${domain}`;
    };
    const mapPrismaError = (error: Prisma.PrismaClientKnownRequestError) => {
        if (error.code === 'P2002') return { status: 409, message: 'A user with this email or details already exists.' };
        if (error.code === 'P2023') return { status: 400, message: 'Invalid input value provided for a field.' };
        if (error.code === 'P2003') return { status: 400, message: 'Provided related reference is invalid.' };
        if (error.code === 'P2022') return { status: 500, message: 'Database schema is out of sync for this operation. Apply latest migrations and retry.' };
        if (error.code === 'P2009') return { status: 500, message: 'Database query validation failed due to schema mismatch. Apply latest migrations and retry.' };
        return { status: 500, message: 'Internal server error' };
    };
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const rl = await rateLimitStrict(ip);
        if (!rl.success) return getRateLimitResponse(rl);

        body = await request.json();
        const {
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            role,
            dateOfBirth,
            gender,
            storeName,
            storeDescription,
            category,
            whatsappNumber,
            campus,
            position,
            isChurchAffiliated,
            verificationDocuments,
            businessAddress,
            bankName,
            accountName,
            accountNumber,
            agreeToTerms,
        } = body;

        if (!email || !password || !firstName || !lastName || !phoneNumber || !role) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (role !== UserRole.BUYER && role !== UserRole.VENDOR) {
            return NextResponse.json(
                { success: false, error: 'Invalid role. Must be BUYER or VENDOR' },
                { status: 400 }
            );
        }

        if (agreeToTerms !== true) {
            return NextResponse.json(
                { success: false, error: 'Terms & Conditions must be accepted' },
                { status: 400 }
            );
        }

        if (role === UserRole.VENDOR) {
            if (!storeName || !category || !whatsappNumber || !campus || !businessAddress?.trim()) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Missing required vendor fields: storeName, category, whatsappNumber, campus, businessAddress',
                    },
                    { status: 400 }
                );
            }

            if (!isValidEnumValue(category, Object.values(VendorCategory) as readonly string[])) {
                return NextResponse.json(
                    { success: false, error: 'Invalid vendor category' },
                    { status: 400 }
                );
            }

            if (!isValidEnumValue(campus, Object.values(Campus) as readonly string[])) {
                return NextResponse.json(
                    { success: false, error: 'Invalid campus value' },
                    { status: 400 }
                );
            }

            if (
                position &&
                !isValidEnumValue(position, Object.values(Position) as readonly string[])
            ) {
                return NextResponse.json(
                    { success: false, error: 'Invalid church position value' },
                    { status: 400 }
                );
            }

            const docs = Array.isArray(verificationDocuments) ? verificationDocuments : [];
            const requiredDocTypes = ['ID', 'BUSINESS_REGISTRATION', 'UTILITY_BILL'];
            const hasAllRequiredDocs = requiredDocTypes.every((requiredType) =>
                docs.some((doc: Record<string, unknown>) => doc?.documentType === requiredType)
            );

            if (!hasAllRequiredDocs) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'All vendor verification documents are required: valid ID, business registration certificate, and utility bill.',
                    },
                    { status: 400 }
                );
            }

            const hasUnsupportedDocUrl = docs.some((doc: Record<string, unknown>) => {
                const url = typeof doc.url === 'string' ? doc.url : '';
                return !url.startsWith('https://res.cloudinary.com/');
            });

            if (hasUnsupportedDocUrl) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Verification documents must use managed Cloudinary upload URLs.',
                    },
                    { status: 400 }
                );
            }
        }

        if (gender && !isValidEnumValue(gender, Object.values(Gender) as readonly string[])) {
            return NextResponse.json(
                { success: false, error: 'Invalid gender value' },
                { status: 400 }
            );
        }

        let parsedDateOfBirth: Date | undefined;
        if (dateOfBirth) {
            const maybeDate = new Date(dateOfBirth);
            if (Number.isNaN(maybeDate.getTime())) {
                return NextResponse.json(
                    { success: false, error: 'Invalid dateOfBirth value' },
                    { status: 400 }
                );
            }
            parsedDateOfBirth = maybeDate;
        }

        const companyCategory = (category || VendorCategory.OTHERS) as VendorCategory;
        const vendorCampus = (campus || Campus.IKEJA) as Campus;

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);
        const verificationToken = uuidv4();
        const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Use a transaction to create user + role profile + wallet atomically
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Count existing users of this role for registration sequence
            const roleCount = await tx.user.count({ where: { role } });

            const user = await tx.user.create({
                data: {
                    email: email.toLowerCase().trim(),
                    password: passwordHash,
                    firstName,
                    lastName,
                    phoneNumber,
                    role,
                    emailVerified: false,
                    isActive: true,
                    emailVerificationToken: verificationToken,
                    emailVerificationExpiry,
                    // registrationSequence is optional and can collide across roles in older schemas.
                    // We avoid forcing unique sequence here to prevent P2002 conflicts on parallel signups.
                },
            });

            // Create wallet
            await tx.wallet.create({
                data: { userId: user.id },
            });

            if (role === UserRole.BUYER) {
                await tx.buyer.create({
                    data: {
                        userId: user.id,
                        dateOfBirth: parsedDateOfBirth,
                        gender: gender || undefined,
                        preferences: { notifications: { email: true, sms: true, push: true } },
                    },
                });

                // Auto-assign milestone if first 1000 buyers
                if (roleCount + 1 <= 1000) {
                    await tx.userMilestone.create({
                        data: {
                            userId: user.id,
                            milestoneType: 'FIRST_1000_BUYERS',
                            label: `Early Adopter Buyer #${roleCount + 1}`,
                            metadata: { sequence: roleCount + 1 },
                        },
                    });
                }
            } else if (role === UserRole.VENDOR) {
                const categoryCommissionOverride = await tx.commissionConfig.findUnique({
                    where: { category: companyCategory },
                    select: { rate: true },
                });
                const defaultTierConfig = await tx.commerceLifecycleConfig.findUnique({
                    where: { key: 'default' },
                    select: { commissionDefaultRate: true },
                });
                const commissionRate =
                    categoryCommissionOverride?.rate ??
                    defaultTierConfig?.commissionDefaultRate ??
                    CATEGORY_COMMISSION_DEFAULTS[companyCategory] ??
                    COMMISSION_RATES.DEFAULT;
                const businessVerificationData: Prisma.InputJsonValue = {
                    verificationDocuments: verificationDocuments?.length
                        ? verificationDocuments
                        : undefined,
                    businessAddress: businessAddress || undefined,
                    idType: body?.idType || undefined,
                    churchPosition: position || undefined,
                    bankDetails:
                        bankName || accountName || accountNumber
                            ? {
                                bankName: bankName || undefined,
                                accountName: accountName || undefined,
                                accountNumber: accountNumber || undefined,
                            }
                            : undefined,
                };

                const vendorCreateData: Prisma.VendorUncheckedCreateInput = {
                    userId: user.id,
                    storeName,
                    storeDescription: storeDescription || null,
                    category: companyCategory,
                    whatsappNumber,
                    campus: vendorCampus,
                    position: position || undefined,
                    status: 'PENDING',
                    isChurchAffiliated: isChurchAffiliated || false,
                    commissionRate,
                    businessVerification: businessVerificationData,
                    storeSettings: {
                        allowsPickup: true,
                        allowsDelivery: false,
                        pickupServices: [],
                        deliveryZones: [],
                    },
                };

                try {
                    await tx.vendor.create({ data: vendorCreateData });
                } catch (createError) {
                    if (isPrismaKnownError(createError)) {
                        const inferredField = inferFieldFromPrismaError(createError);
                        const isPositionDrift =
                            inferredField.includes('position') &&
                            (createError.code === 'P2022' || createError.code === 'P2009' || createError.code === 'P2023');

                        // Backward-compatible fallback: if DB is behind on position column/enum,
                        // complete vendor registration and preserve selected church position inside JSON metadata.
                        if (isPositionDrift) {
                            console.warn('register vendor fallback: omitting vendor.position due to schema drift', {
                                ...logBase,
                                prismaCode: createError.code,
                                inferredField,
                                role: body?.role,
                                email: maskEmail(body?.email),
                            });

                            await tx.vendor.create({
                                data: {
                                    ...vendorCreateData,
                                    position: undefined,
                                },
                            });
                        } else {
                            throw createError;
                        }
                    } else {
                        throw createError;
                    }
                }

                // Auto-assign milestone if first 1000 vendors
                if (roleCount + 1 <= 1000) {
                    await tx.userMilestone.create({
                        data: {
                            userId: user.id,
                            milestoneType: 'FIRST_1000_VENDORS',
                            label: `Early Adopter Vendor #${roleCount + 1}`,
                            metadata: { sequence: roleCount + 1 },
                        },
                    });
                }
            }

            return user;
        });

        // Send verification email (non-blocking)
        sendVerifyEmail(result.email, result.firstName, verificationToken).catch((err) =>
            console.error('Failed to send verification email:', { ...logBase, error: err })
        );

        // Important: Do not log the user in until email is verified.
        return NextResponse.json(
            {
                success: true,
                message: 'Registration successful. Please verify your email address before logging in.',
                needsEmailVerification: true,
                user: {
                    id: result.id,
                    email: result.email,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    phoneNumber: result.phoneNumber,
                    role: result.role,
                    profilePicture: result.profilePicture,
                    emailVerified: result.emailVerified,
                    isActive: result.isActive,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        // Handle validation errors thrown from transaction
        if (error instanceof Error && error.message.startsWith('VALIDATION:')) {
            return NextResponse.json(
                { success: false, error: error.message.replace('VALIDATION:', '') },
                { status: 400 }
            );
        }

        if (isPrismaKnownError(error)) {
            const pError = error;
            const fields = inferFieldFromPrismaError(pError);
            const mapped = mapPrismaError(pError);
            console.warn('register prisma error', {
                ...logBase,
                prismaCode: pError.code,
                fieldTarget: fields,
                role: body?.role,
                email: maskEmail(body?.email),
            });
            return NextResponse.json(
                { success: false, error: mapped.message, details: fields, correlationId },
                { status: mapped.status }
            );
        }

        console.error('Registration error', {
            ...logBase,
            email: maskEmail(body?.email),
            role: body?.role,
            error,
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error', correlationId },
            { status: 500 }
        );
    }
}
