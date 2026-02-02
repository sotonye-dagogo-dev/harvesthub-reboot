/**
 * Product Validation Schemas
 * Zod schemas for product creation, updates, and filtering
 */

import { z } from 'zod';
import { ProductCategory } from '@/lib/constants';
import { VALIDATION_RULES } from '@/lib/constants';

// ============================================================================
// PRODUCT VARIANT SCHEMA
// ============================================================================

export const productVariantSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Variant name is required').max(50, 'Variant name too long'),
    values: z.array(z.string().min(1, 'Value cannot be empty')).min(1, 'At least one value is required'),
    priceAdjustment: z.number().optional(),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;

// ============================================================================
// CREATE PRODUCT SCHEMA
// ============================================================================

export const createProductSchema = z.object({
    name: z
        .string()
        .min(3, 'Product name must be at least 3 characters')
        .max(VALIDATION_RULES.MAX_PRODUCT_NAME_LENGTH, `Product name must not exceed ${VALIDATION_RULES.MAX_PRODUCT_NAME_LENGTH} characters`)
        .trim(),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(VALIDATION_RULES.MAX_PRODUCT_DESCRIPTION_LENGTH, `Description must not exceed ${VALIDATION_RULES.MAX_PRODUCT_DESCRIPTION_LENGTH} characters`)
        .trim(),
    category: z.nativeEnum(ProductCategory, {
        errorMap: () => ({ message: 'Please select a product category' }),
    }),
    price: z
        .number()
        .min(VALIDATION_RULES.MIN_PRODUCT_PRICE, `Price must be at least ₦${VALIDATION_RULES.MIN_PRODUCT_PRICE}`)
        .positive('Price must be positive'),
    compareAtPrice: z
        .number()
        .positive('Compare at price must be positive')
        .optional()
        .nullable(),
    stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
    images: z
        .array(z.string().url('Invalid image URL'))
        .min(1, 'At least one image is required')
        .max(VALIDATION_RULES.MAX_IMAGES_PER_PRODUCT, `Maximum ${VALIDATION_RULES.MAX_IMAGES_PER_PRODUCT} images allowed`),
    mainImage: z.string().url('Invalid main image URL').optional(),
    variants: z.array(productVariantSchema).optional().nullable(),
    tags: z.array(z.string().trim()).optional().nullable(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
})
    .refine(
        (data) => {
            if (data.compareAtPrice && data.compareAtPrice <= data.price) {
                return false;
            }
            return true;
        },
        {
            message: 'Compare at price must be greater than regular price',
            path: ['compareAtPrice'],
        }
    );

export type CreateProductInput = z.infer<typeof createProductSchema>;

// ============================================================================
// UPDATE PRODUCT SCHEMA
// ============================================================================

export const updateProductSchema = z.object({
    id: z.string().min(1, 'Product ID is required'),
    name: z
        .string()
        .min(3, 'Product name must be at least 3 characters')
        .max(VALIDATION_RULES.MAX_PRODUCT_NAME_LENGTH, `Product name must not exceed ${VALIDATION_RULES.MAX_PRODUCT_NAME_LENGTH} characters`)
        .trim()
        .optional(),
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(VALIDATION_RULES.MAX_PRODUCT_DESCRIPTION_LENGTH, `Description must not exceed ${VALIDATION_RULES.MAX_PRODUCT_DESCRIPTION_LENGTH} characters`)
        .trim()
        .optional(),
    category: z.nativeEnum(ProductCategory, {
        errorMap: () => ({ message: 'Please select a product category' }),
    }).optional(),
    price: z
        .number()
        .min(VALIDATION_RULES.MIN_PRODUCT_PRICE, `Price must be at least ₦${VALIDATION_RULES.MIN_PRODUCT_PRICE}`)
        .positive('Price must be positive')
        .optional(),
    compareAtPrice: z
        .number()
        .positive('Compare at price must be positive')
        .optional()
        .nullable(),
    stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').optional(),
    images: z
        .array(z.string().url('Invalid image URL'))
        .min(1, 'At least one image is required')
        .max(VALIDATION_RULES.MAX_IMAGES_PER_PRODUCT, `Maximum ${VALIDATION_RULES.MAX_IMAGES_PER_PRODUCT} images allowed`)
        .optional(),
    mainImage: z.string().url('Invalid main image URL').optional().nullable(),
    variants: z.array(productVariantSchema).optional().nullable(),
    tags: z.array(z.string().trim()).optional().nullable(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ============================================================================
// PRODUCT FILTER SCHEMA
// ============================================================================

export const productFilterSchema = z.object({
    category: z.nativeEnum(ProductCategory).optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    vendorId: z.string().optional(),
    campus: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    inStock: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'popularity', 'newest']).optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(VALIDATION_RULES.MAX_IMAGES_PER_PRODUCT).default(20),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

// ============================================================================
// BULK UPDATE STOCK SCHEMA
// ============================================================================

export const bulkUpdateStockSchema = z.object({
    products: z.array(
        z.object({
            productId: z.string().min(1, 'Product ID is required'),
            stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
        })
    ).min(1, 'At least one product is required'),
});

export type BulkUpdateStockInput = z.infer<typeof bulkUpdateStockSchema>;
