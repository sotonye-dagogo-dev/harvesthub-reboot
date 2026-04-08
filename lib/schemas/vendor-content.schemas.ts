/**
 * Vendor Content Validation Schemas
 * Zod schemas for vendor marketing content creation and moderation
 */

import { z } from 'zod';

export const vendorContentTypeEnum = z.enum(['IMAGE', 'VIDEO', 'TEXT', 'PROMO_BANNER']);
export const vendorContentTargetPlatformEnum = z.enum([
    'instagram',
    'tiktok',
    'twitter',
    'website',
    'all',
]);

export const createVendorContentSchema = z.object({
    type: vendorContentTypeEnum,
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(120, 'Title must be 120 characters or fewer')
        .trim(),
    description: z
        .string()
        .max(500, 'Description must be 500 characters or fewer')
        .trim()
        .optional(),
    textContent: z
        .string()
        .max(2000, 'Text content must be 2000 characters or fewer')
        .trim()
        .optional(),
    usageRights: z.boolean({ required_error: 'You must confirm usage rights' }),
    targetPlatform: vendorContentTargetPlatformEnum.default('all'),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional(),
});

export const moderateVendorContentSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().max(500).optional(),
});

export type CreateVendorContentInput = z.infer<typeof createVendorContentSchema>;
export type ModerateVendorContentInput = z.infer<typeof moderateVendorContentSchema>;
