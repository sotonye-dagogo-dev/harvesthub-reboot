/**
 * Authentication API Integration Tests
 * Tests the complete auth flow: login, register, logout, refresh
 */

import { describe, it, expect } from 'vitest';

describe('Authentication API Integration Tests', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new buyer successfully', async () => {
            const newBuyer = {
                email: `test${Date.now()}@example.com`,
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'Test',
                lastName: 'Buyer',
                phoneNumber: '08012345678',
                role: 'BUYER',
                agreeToTerms: true,
            };

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBuyer),
            });

            expect(response.status).toBe(201);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.user.email).toBe(newBuyer.email.toLowerCase());
        });

        it('should reject duplicate email registration', async () => {
            const duplicateEmail = {
                email: 'buyer1@example.com', // Existing user from mockData
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'Test',
                lastName: 'Buyer',
                phoneNumber: '08012345678',
                role: 'BUYER',
                agreeToTerms: true,
            };

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(duplicateEmail),
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toContain('already exists');
        });

        it('should validate password strength', async () => {
            const weakPassword = {
                email: 'test@example.com',
                password: 'weak',
                confirmPassword: 'weak',
                firstName: 'Test',
                lastName: 'Buyer',
                phoneNumber: '08012345678',
                role: 'BUYER',
                agreeToTerms: true,
            };

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(weakPassword),
            });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login existing user with correct credentials', async () => {
            const credentials = {
                email: 'buyer1@example.com',
                password: 'buyer123',
            };

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
                credentials: 'include',
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.user.email).toBe(credentials.email.toLowerCase());
            expect(data.accessToken).toBeDefined();
        });

        it('should reject login with incorrect password', async () => {
            const credentials = {
                email: 'buyer1@example.com',
                password: 'wrongpassword',
            };

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.success).toBe(false);
        });

        it('should reject login for non-existent user', async () => {
            const credentials = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout user and clear cookies', async () => {
            const response = await fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user when authenticated', async () => {
            // First login to get token
            const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'buyer1@example.com',
                    password: 'buyer123',
                }),
                credentials: 'include',
            });

            const loginData = await loginResponse.json();
            const token = loginData.accessToken;

            // Then fetch current user
            const meResponse = await fetch('http://localhost:3000/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            });

            expect(meResponse.status).toBe(200);
            const data = await meResponse.json();
            expect(data.success).toBe(true);
            expect(data.user.email).toBe('buyer1@example.com');
        });

        it('should return 401 when not authenticated', async () => {
            const response = await fetch('http://localhost:3000/api/auth/me');
            expect(response.status).toBe(401);
        });
    });
});
