/**
 * POST /api/auth/register
 * 
 * Register a new user (buyer or vendor)
 */

import { NextRequest, NextResponse } from 'next/server';
import { userDb, buyerDb, vendorDb, walletDb } from '@/lib/data/database';
import { hashPassword } from '@/lib/utils/password';
import { generateTokenPair } from '@/lib/utils/jwt';
import { setAuthCookies } from '@/lib/utils/cookies';
import { UserRole, VendorStatus } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            role,
            // Buyer-specific fields
            dateOfBirth,
            gender,
            // Vendor-specific fields
            storeName,
            storeDescription,
            category,
            whatsappNumber,
            campus,
            isChurchAffiliated,
        } = body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !phoneNumber || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate role
        if (![UserRole.BUYER, UserRole.VENDOR].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be BUYER or VENDOR' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = userDb.findByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = userDb.create(
            {
                email,
                firstName,
                lastName,
                phoneNumber,
                role,
                emailVerified: false,
                isActive: true,
            },
            passwordHash
        );

        // Create wallet for user
        const wallet = walletDb.create(user.id);

        // Create role-specific profile
        if (role === UserRole.BUYER) {
            buyerDb.create({
                userId: user.id,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender: gender || undefined,
                preferences: {
                    notifications: {
                        email: true,
                        sms: true,
                        push: true,
                    },
                },
            });
        } else if (role === UserRole.VENDOR) {
            // Validate vendor-specific fields
            if (!storeName || !category || !whatsappNumber || !campus) {
                // Rollback user creation
                userDb.delete(user.id);
                walletDb.delete(wallet.id);

                return NextResponse.json(
                    {
                        error: 'Missing required vendor fields: storeName, category, whatsappNumber, campus',
                    },
                    { status: 400 }
                );
            }

            vendorDb.create({
                userId: user.id,
                storeName,
                storeDescription: storeDescription || null,
                category,
                whatsappNumber,
                campus,
                status: VendorStatus.PENDING,
                isChurchAffiliated: isChurchAffiliated || false,
                commissionRate: 0.05, // Default 5% commission
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: false,
                    pickupServices: [],
                    deliveryZones: [],
                },
                analytics: {
                    totalSales: 0,
                    totalOrders: 0,
                    totalProducts: 0,
                    averageRating: 0,
                    totalReviews: 0,
                    conversionRate: 0,
                    lastUpdated: new Date(),
                },
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokenPair(user.id, user.email, user.role);

        // Set cookies
        await setAuthCookies(accessToken, refreshToken);

        // Return user data (without password)
        return NextResponse.json(
            {
                message: 'Registration successful',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    emailVerified: user.emailVerified,
                    isActive: user.isActive,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
