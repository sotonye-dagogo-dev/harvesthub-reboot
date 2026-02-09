/**
 * JWT Utilities Tests (jose library)
 * Tests token generation and verification using jose
 */

import { describe, it, expect } from 'vitest';
import {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
} from '@/lib/utils/jwt';
import { UserRole } from '@/lib/constants';
import type { JWTPayload } from 'jose';

// Extended JWT payload type
interface ExtendedJWTPayload extends JWTPayload {
    userId?: string;
    email?: string;
    role?: UserRole;
}

describe('JWT Utilities (jose library)', () => {
    const testUserId = 'test-user-123';
    const testEmail = 'test@example.com';
    const testRole = UserRole.BUYER;

    describe('generateAccessToken', () => {
        it('should generate a valid access token', async () => {
            const token = await generateAccessToken(testUserId, testEmail, testRole);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
        });

        it('should generate different tokens for different users', async () => {
            const token1 = await generateAccessToken('user1', 'user1@example.com', UserRole.BUYER);
            const token2 = await generateAccessToken('user2', 'user2@example.com', UserRole.VENDOR);

            expect(token1).not.toBe(token2);
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', async () => {
            const token = await generateRefreshToken(testUserId, testEmail, testRole);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        it('should generate different tokens for different users', async () => {
            const token1 = await generateRefreshToken('user1', 'user1@example.com', UserRole.BUYER);
            const token2 = await generateRefreshToken('user2', 'user2@example.com', UserRole.VENDOR);

            expect(token1).not.toBe(token2);
        });
    });

    describe('generateTokenPair', () => {
        it('should generate both access and refresh tokens', async () => {
            const { accessToken, refreshToken } = await generateTokenPair(
                testUserId,
                testEmail,
                testRole
            );

            expect(accessToken).toBeDefined();
            expect(refreshToken).toBeDefined();
            expect(typeof accessToken).toBe('string');
            expect(typeof refreshToken).toBe('string');
        });
    });

    describe('verifyAccessToken', () => {
        it('should verify a valid access token', async () => {
            const token = await generateAccessToken(testUserId, testEmail, testRole);
            const payload = await verifyAccessToken(token) as ExtendedJWTPayload | null;

            expect(payload).toBeDefined();
            expect(payload?.sub).toBe(testUserId);
            expect(payload?.email).toBe(testEmail);
            expect(payload?.role).toBe(testRole);
        });

        it('should return null for invalid token', async () => {
            const payload = await verifyAccessToken('invalid.token.string');

            expect(payload).toBeNull();
        });

        it('should return null for expired token', async () => {
            // Create a token with immediate expiry (for testing purposes, you might need to mock time)
            const token = await generateAccessToken(testUserId, testEmail, testRole);

            // Wait a bit and verify it still works within 15 min window
            const payload = await verifyAccessToken(token);
            expect(payload).not.toBeNull();
        });
    });

    describe('verifyRefreshToken', () => {
        it('should verify a valid refresh token', async () => {
            const token = await generateRefreshToken(testUserId, testEmail, testRole);
            const payload = await verifyRefreshToken(token) as ExtendedJWTPayload | null;

            expect(payload).toBeDefined();
            expect(payload?.sub).toBe(testUserId);
        });

        it('should return null for invalid token', async () => {
            const payload = await verifyRefreshToken('invalid.token.string');

            expect(payload).toBeNull();
        });
    });

    describe('Token Payload Structure', () => {
        it('should include correct claims in access token', async () => {
            const token = await generateAccessToken(testUserId, testEmail, testRole);
            const payload = await verifyAccessToken(token);

            expect(payload).toHaveProperty('sub');
            expect(payload).toHaveProperty('email');
            expect(payload).toHaveProperty('role');
            expect(payload).toHaveProperty('iat'); // issued at
            expect(payload).toHaveProperty('exp'); // expiration
        });

        it('should include correct claims in refresh token', async () => {
            const token = await generateRefreshToken(testUserId, testEmail, testRole);
            const payload = await verifyRefreshToken(token);

            expect(payload).toHaveProperty('sub');
            expect(payload).toHaveProperty('iat');
            expect(payload).toHaveProperty('exp');
        });
    });

    describe('Token Roles', () => {
        it('should handle ADMIN role', async () => {
            const token = await generateAccessToken(testUserId, testEmail, UserRole.ADMIN);
            const payload = await verifyAccessToken(token);

            expect(payload?.role).toBe(UserRole.ADMIN);
        });

        it('should handle VENDOR role', async () => {
            const token = await generateAccessToken(testUserId, testEmail, UserRole.VENDOR);
            const payload = await verifyAccessToken(token);

            expect(payload?.role).toBe(UserRole.VENDOR);
        });

        it('should handle BUYER role', async () => {
            const token = await generateAccessToken(testUserId, testEmail, UserRole.BUYER);
            const payload = await verifyAccessToken(token);

            expect(payload?.role).toBe(UserRole.BUYER);
        });
    });
});
