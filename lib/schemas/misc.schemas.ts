/**
 * Wallet and Address Validation Schemas
 * Zod schemas for wallet operations and address management
 */

import { z } from 'zod';
import { VALIDATION_RULES, PHONE_PREFIX, Campus } from '@/lib/constants';

// ============================================================================
// WALLET DEPOSIT SCHEMA
// ============================================================================

export const depositSchema = z.object({
    amount: z
        .number()
        .min(VALIDATION_RULES.MIN_DEPOSIT, `Minimum deposit is ₦${VALIDATION_RULES.MIN_DEPOSIT}`)
        .positive('Amount must be positive'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
});

export type DepositInput = z.infer<typeof depositSchema>;

// ============================================================================
// WALLET WITHDRAWAL SCHEMA
// ============================================================================

export const withdrawalSchema = z.object({
    amount: z
        .number()
        .min(VALIDATION_RULES.MIN_WITHDRAWAL, `Minimum withdrawal is ₦${VALIDATION_RULES.MIN_WITHDRAWAL}`)
        .max(VALIDATION_RULES.MAX_WITHDRAWAL, `Maximum withdrawal is ₦${VALIDATION_RULES.MAX_WITHDRAWAL}`)
        .positive('Amount must be positive'),
    bankName: z.string().min(1, 'Bank name is required'),
    accountNumber: z
        .string()
        .length(10, 'Account number must be 10 digits')
        .regex(/^\d+$/, 'Account number must contain only digits'),
    accountName: z.string().min(1, 'Account name is required'),
});

export type WithdrawalInput = z.infer<typeof withdrawalSchema>;

// ============================================================================
// ADDRESS SCHEMA
// ============================================================================

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

const addressBaseSchema = z.object({
    label: z.string().min(1, 'Address label is required').max(50, 'Label too long').trim().optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
    phoneNumber: phoneSchema,
    addressLine1: z.string().min(5, 'Address must be at least 5 characters').trim(),
    addressLine2: z.string().max(200, 'Address line 2 too long').optional().nullable(),
    city: z.string().min(2, 'City is required').trim(),
    state: z.string().min(2, 'State is required').trim(),
    campus: z.nativeEnum(Campus),
    landmark: z.string().max(200, 'Landmark too long').optional().nullable(),
    isDefault: z.boolean().default(false),
});

export const addressSchema = z.preprocess(
    (raw) => {
        if (raw && typeof raw === 'object') {
            const value = raw as Record<string, any>;
            if (value.address && !value.addressLine1) {
                value.addressLine1 = value.address;
            }
            if (!value.label) {
                value.label = 'Default';
            }
        }
        return raw;
    },
    addressBaseSchema
);

export type AddressInput = z.infer<typeof addressSchema>;

export const updateAddressSchema = addressBaseSchema
    .partial()
    .extend({
        id: z.string().min(1, 'Address ID is required'),
    });

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

// ============================================================================
// REVIEW SCHEMA
// ============================================================================

export const createReviewSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    orderId: z.string().min(1, 'Order ID is required'),
    rating: z
        .number()
        .int('Rating must be a whole number')
        .min(VALIDATION_RULES.MIN_RATING, `Minimum rating is ${VALIDATION_RULES.MIN_RATING}`)
        .max(VALIDATION_RULES.MAX_RATING, `Maximum rating is ${VALIDATION_RULES.MAX_RATING}`),
    comment: z
        .string()
        .min(10, 'Review must be at least 10 characters')
        .max(VALIDATION_RULES.MAX_REVIEW_LENGTH, `Review must not exceed ${VALIDATION_RULES.MAX_REVIEW_LENGTH} characters`)
        .optional()
        .nullable(),
    images: z
        .array(z.string().url('Invalid image URL'))
        .max(VALIDATION_RULES.MAX_IMAGES_PER_REVIEW, `Maximum ${VALIDATION_RULES.MAX_IMAGES_PER_REVIEW} images allowed`)
        .optional()
        .nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
    reviewId: z.string().min(1, 'Review ID is required'),
    rating: z
        .number()
        .int('Rating must be a whole number')
        .min(VALIDATION_RULES.MIN_RATING, `Minimum rating is ${VALIDATION_RULES.MIN_RATING}`)
        .max(VALIDATION_RULES.MAX_RATING, `Maximum rating is ${VALIDATION_RULES.MAX_RATING}`),
    comment: z
        .string()
        .max(VALIDATION_RULES.MAX_REVIEW_LENGTH, `Review must not exceed ${VALIDATION_RULES.MAX_REVIEW_LENGTH} characters`)
        .optional()
        .nullable(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
