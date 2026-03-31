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
import { CATEGORY_COMMISSION_DEFAULTS, COMMISSION_RATES, VendorCategory, Campus, UserRole, Gender } from '@/lib/constants';
import { randomUUID as uuidv4 } from 'crypto';

const isValidEnumValue = <T extends readonly string[]>(value: unknown, enumValues: T): value is T[number] =>
    typeof value === 'string' && (enumValues as readonly string[]).includes(value);

export async function POST(request: NextRequest) {
    let body: any = null;
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
            if (!storeName || !category || !whatsappNumber || !campus) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Missing required vendor fields: storeName, category, whatsappNumber, campus',
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
                    registrationSequence: roleCount + 1,
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
                const commissionRate = CATEGORY_COMMISSION_DEFAULTS[companyCategory] ?? COMMISSION_RATES.DEFAULT;

                await tx.vendor.create({
                    data: {
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
                        businessVerification: {
                            verificationDocuments: verificationDocuments?.length
                                ? verificationDocuments
                                : undefined,
                            businessAddress: businessAddress || undefined,
                            bankDetails:
                                bankName || accountName || accountNumber
                                    ? {
                                        bankName: bankName || undefined,
                                        accountName: accountName || undefined,
                                        accountNumber: accountNumber || undefined,
                                    }
                                    : undefined,
                        },
                        storeSettings: {
                            allowsPickup: true,
                            allowsDelivery: false,
                            pickupServices: [],
                            deliveryZones: [],
                        },
                    },
                });

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
            console.error('Failed to send verification email:', err)
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

        if (error && typeof error === 'object' && 'code' in error) {
            const pError = error as Prisma.PrismaClientKnownRequestError;
            if (pError.code === 'P2002') {
                const fields = Array.isArray(pError.meta?.target)
                    ? (pError.meta.target as string[]).join(', ')
                    : 'unknown field';
                let message = 'A user with this email or details already exists.';
                if (fields.includes('registrationSequence')) {
                    message = 'Registration race condition detected. Please retry the signup flow.';
                } else if (fields.includes('email')) {
                    message = 'A user with this email already exists.';
                }
                return NextResponse.json(
                    { success: false, error: message, details: fields },
                    { status: 409 }
                );
            }
            if (pError.code === 'P2023') {
                return NextResponse.json(
                    { success: false, error: 'Invalid input value provided for a field.' },
                    { status: 400 }
                );
            }
        }

        console.error('Registration error:', {
            email: body?.email,
            role: body?.role,
            error,
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
