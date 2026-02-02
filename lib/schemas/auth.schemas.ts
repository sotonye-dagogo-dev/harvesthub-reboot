/**
 * Authentication Validation Schemas
 * Zod schemas for login, registration, and password operations
 */

import { z } from 'zod';
import { UserRole, Campus, VendorCategory } from '@/lib/constants';
import { VALIDATION_RULES, PHONE_PREFIX } from '@/lib/constants';

// ============================================================================
// HELPER VALIDATORS
// ============================================================================

const passwordSchema = z
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`)
    .max(VALIDATION_RULES.PASSWORD_MAX_LENGTH, `Password must not exceed ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailSchema = z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim();

const phoneSchema = z
    .string()
    .refine(
        (val) => {
            const cleaned = val.replace(/\D/g, '');
            return (
                (cleaned.length === VALIDATION_RULES.PHONE_LENGTH && cleaned.startsWith('0')) ||
                (cleaned.length === 13 && cleaned.startsWith('234'))
            );
        },
        {
            message: `Invalid phone number. Must be ${VALIDATION_RULES.PHONE_LENGTH} digits starting with 0 or 13 digits starting with 234`,
        }
    )
    .transform((val) => {
        const cleaned = val.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            return `${PHONE_PREFIX}${cleaned.slice(1)}`;
        }
        if (cleaned.startsWith('234')) {
            return `+${cleaned}`;
        }
        return val;
    });

// ============================================================================
// LOGIN SCHEMA
// ============================================================================

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// REGISTER SCHEMA (BUYER)
// ============================================================================

export const registerBuyerSchema = z
    .object({
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string(),
        firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
        lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
        phoneNumber: phoneSchema,
        role: z.literal(UserRole.BUYER),
        agreeToTerms: z.boolean().refine((val) => val === true, {
            message: 'You must agree to the terms and conditions',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type RegisterBuyerInput = z.infer<typeof registerBuyerSchema>;

// ============================================================================
// REGISTER SCHEMA (VENDOR)
// ============================================================================

export const registerVendorSchema = z
    .object({
        // User fields
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string(),
        firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
        lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
        phoneNumber: phoneSchema,
        role: z.literal(UserRole.VENDOR),
        agreeToTerms: z.boolean().refine((val) => val === true, {
            message: 'You must agree to the terms and conditions',
        }),

        // Vendor fields
        storeName: z.string().min(3, 'Store name must be at least 3 characters').trim(),
        storeDescription: z.string().max(500, 'Description must not exceed 500 characters').optional(),
        storeCategory: z.nativeEnum(VendorCategory, {
            errorMap: () => ({ message: 'Please select a store category' }),
        }),
        whatsappNumber: phoneSchema,
        campus: z.nativeEnum(Campus, {
            errorMap: () => ({ message: 'Please select a campus location' }),
        }),
        isChurchAffiliated: z.boolean().default(false),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type RegisterVendorInput = z.infer<typeof registerVendorSchema>;

// ============================================================================
// FORGOT PASSWORD SCHEMA
// ============================================================================

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ============================================================================
// RESET PASSWORD SCHEMA
// ============================================================================

export const resetPasswordSchema = z
    .object({
        email: emailSchema,
        token: z.string().min(1, 'Reset token is required'),
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// CHANGE PASSWORD SCHEMA
// ============================================================================

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: 'New password must be different from current password',
        path: ['newPassword'],
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================================================
// UPDATE PROFILE SCHEMA
// ============================================================================

export const updateProfileSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
    phoneNumber: phoneSchema,
    dateOfBirth: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
