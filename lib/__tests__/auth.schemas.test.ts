import { describe, it, expect } from 'vitest';
import {
    loginSchema,
    registerBuyerSchema,
    registerVendorSchema,
} from '@/lib/schemas/auth.schemas';

describe('Auth Validation Schemas', () => {
    describe('loginSchema', () => {
        it('should validate correct login data', () => {
            const validData = {
                email: 'test@example.com',
                password: 'Password123!',
            };

            const result = loginSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid email', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'Password123!',
            };

            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.path).toContain('email');
            }
        });

        it('should reject empty password', () => {
            const invalidData = {
                email: 'test@example.com',
                password: '',
            };

            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0]?.path).toContain('password');
            }
        });

        it('should reject missing fields', () => {
            const invalidData = {
                email: 'test@example.com',
            };

            const result = loginSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('registerBuyerSchema', () => {
        it('should validate correct buyer registration data', () => {
            const validData = {
                email: 'buyer@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '08012345678',
                role: 'BUYER',
                agreeToTerms: true,
            };

            const result = registerBuyerSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject when passwords do not match', () => {
            const invalidData = {
                email: 'buyer@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'DifferentPass123!',
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '08012345678',
                role: 'BUYER',
                agreeToTerms: true,
            };

            const result = registerBuyerSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some((issue) =>
                    issue.message.toLowerCase().includes('password')
                )).toBe(true);
            }
        });

        it('should accept valid Nigerian phone number formats', () => {
            const testNumbers = [
                '08012345678',
                '07012345678',
                '09012345678',
                '+2348012345678',
            ];

            testNumbers.forEach((phoneNumber) => {
                const data = {
                    email: 'buyer@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!',
                    firstName: 'John',
                    lastName: 'Doe',
                    phoneNumber,
                    role: 'BUYER',
                    agreeToTerms: true,
                };

                const result = registerBuyerSchema.safeParse(data);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid phone numbers', () => {
            const invalidNumbers = [
                '123456',
                '08012',
                'not-a-number',
                '+1234567890',
            ];

            invalidNumbers.forEach((phoneNumber) => {
                const data = {
                    email: 'buyer@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!',
                    firstName: 'John',
                    lastName: 'Doe',
                    phoneNumber,
                    role: 'BUYER',
                    agreeToTerms: true,
                };

                const result = registerBuyerSchema.safeParse(data);
                expect(result.success).toBe(false);
            });
        });

        it('should reject weak passwords', () => {
            const weakPasswords = [
                'short',
                'alllowercase123',
                'ALLUPPERCASE123',
                'NoNumbers!',
            ];

            weakPasswords.forEach((password) => {
                const data = {
                    email: 'buyer@example.com',
                    password,
                    confirmPassword: password,
                    firstName: 'John',
                    lastName: 'Doe',
                    phoneNumber: '08012345678',
                    role: 'BUYER',
                    agreeToTerms: true,
                };

                const result = registerBuyerSchema.safeParse(data);
                expect(result.success).toBe(false);
            });
        });

        it('should reject invalid email formats', () => {
            const invalidEmails = [
                'notanemail',
                '@example.com',
                'test@',
                'test.example.com',
            ];

            invalidEmails.forEach((email) => {
                const data = {
                    email,
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!',
                    firstName: 'John',
                    lastName: 'Doe',
                    phoneNumber: '08012345678',
                    role: 'BUYER',
                    agreeToTerms: true,
                };

                const result = registerBuyerSchema.safeParse(data);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('registerVendorSchema', () => {
        it('should validate correct vendor registration data', () => {
            const validData = {
                email: 'vendor@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'Jane',
                lastName: 'Smith',
                phoneNumber: '08087654321',
                role: 'VENDOR',
                agreeToTerms: true,
                storeName: 'Fresh Foods Store',
                storeDescription: 'Selling fresh farm produce',
                storeCategory: 'AGRICULTURE',
                whatsappNumber: '08087654321',
                campus: 'GBAGADA',
            };

            const result = registerVendorSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject vendor registration without store name', () => {
            const invalidData = {
                email: 'vendor@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'Jane',
                lastName: 'Smith',
                phoneNumber: '08087654321',
                role: 'VENDOR',
                agreeToTerms: true,
                storeDescription: 'Selling fresh farm produce',
                storeCategory: 'AGRICULTURE',
                whatsappNumber: '08087654321',
                campus: 'GBAGADA',
            };

            const result = registerVendorSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject vendor registration without category', () => {
            const invalidData = {
                email: 'vendor@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'Jane',
                lastName: 'Smith',
                phoneNumber: '08087654321',
                role: 'VENDOR',
                agreeToTerms: true,
                storeName: 'Fresh Foods Store',
                storeDescription: 'Selling fresh farm produce',
                whatsappNumber: '08087654321',
                campus: 'GBAGADA',
            };

            const result = registerVendorSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept valid WhatsApp numbers', () => {
            const testNumbers = [
                '08012345678',
                '+2348012345678',
                '2348012345678',
            ];

            testNumbers.forEach((whatsapp) => {
                const data = {
                    email: 'vendor@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    phoneNumber: '08087654321',
                    role: 'VENDOR',
                    agreeToTerms: true,
                    storeName: 'Fresh Foods Store',
                    storeDescription: 'Selling fresh farm produce',
                    storeCategory: 'AGRICULTURE',
                    whatsappNumber: whatsapp,
                    campus: 'GBAGADA',
                };

                const result = registerVendorSchema.safeParse(data);
                expect(result.success).toBe(true);
            });
        });

        it('should validate all required vendor fields are present', () => {
            const completeData = {
                email: 'vendor@example.com',
                password: 'SecurePass123!',
                confirmPassword: 'SecurePass123!',
                firstName: 'Jane',
                lastName: 'Smith',
                phoneNumber: '08087654321',
                role: 'VENDOR',
                agreeToTerms: true,
                storeName: 'Fresh Foods Store',
                storeDescription: 'Selling fresh farm produce',
                storeCategory: 'AGRICULTURE',
                whatsappNumber: '08087654321',
                campus: 'GBAGADA',
            };

            const result = registerVendorSchema.safeParse(completeData);
            expect(result.success).toBe(true);

            // Test each required field
            const requiredFields = [
                'email',
                'password',
                'confirmPassword',
                'firstName',
                'lastName',
                'phoneNumber',
                'role',
                'agreeToTerms',
                'storeName',
                'storeCategory',
                'whatsappNumber',
                'campus',
            ];

            requiredFields.forEach((field) => {
                const incompleteData = { ...completeData };
                delete incompleteData[field as keyof typeof completeData];

                const result = registerVendorSchema.safeParse(incompleteData);
                expect(result.success).toBe(false);
            });
        });
    });
});
