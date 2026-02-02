import { describe, it, expect } from 'vitest';
import {
    createProductSchema,
    updateProductSchema,
    productVariantSchema,
} from '@/lib/schemas/product.schemas';

describe('Product Validation Schemas', () => {
    describe('createProductSchema', () => {
        it('should validate correct product data', () => {
            const validProduct = {
                name: 'Fresh Tomatoes',
                description: 'Locally grown fresh tomatoes',
                price: 5000,
                category: 'Farm Produce',
                stock: 100,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
            };

            const result = createProductSchema.safeParse(validProduct);
            expect(result.success).toBe(true);
        });

        it('should reject negative price', () => {
            const invalidProduct = {
                name: 'Fresh Tomatoes',
                description: 'Locally grown fresh tomatoes',
                price: -100,
                category: 'Farm Produce',
                stock: 100,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
            };

            const result = createProductSchema.safeParse(invalidProduct);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some((issue) =>
                    issue.path.includes('price')
                )).toBe(true);
            }
        });

        it('should reject zero price', () => {
            const invalidProduct = {
                name: 'Fresh Tomatoes',
                description: 'Locally grown fresh tomatoes',
                price: 0,
                category: 'Farm Produce',
                stock: 100,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
            };

            const result = createProductSchema.safeParse(invalidProduct);
            expect(result.success).toBe(false);
        });

        it('should reject negative stock', () => {
            const invalidProduct = {
                name: 'Fresh Tomatoes',
                description: 'Locally grown fresh tomatoes',
                price: 5000,
                category: 'Farm Produce',
                stock: -10,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
            };

            const result = createProductSchema.safeParse(invalidProduct);
            expect(result.success).toBe(false);
        });

        it('should require at least one image', () => {
            const invalidProduct = {
                name: 'Fresh Tomatoes',
                description: 'Locally grown fresh tomatoes',
                price: 5000,
                category: 'Farm Produce',
                stock: 100,
                images: [],
                vendorId: 'vendor-123',
            };

            const result = createProductSchema.safeParse(invalidProduct);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some((issue) =>
                    issue.path.includes('images')
                )).toBe(true);
            }
        });

        it('should validate product with variants', () => {
            const productWithVariants = {
                name: 'T-Shirt',
                description: 'Cotton t-shirt in various sizes',
                price: 5000,
                category: 'Fashion & Apparel',
                stock: 100,
                images: ['https://example.com/tshirt.jpg'],
                vendorId: 'vendor-123',
                variants: [
                    {
                        name: 'Size',
                        values: ['Small', 'Medium', 'Large'],
                        priceAdjustment: 0,
                    },
                    {
                        name: 'Color',
                        values: ['Red', 'Blue', 'Green'],
                        priceAdjustment: 500,
                    },
                ],
            };

            const result = createProductSchema.safeParse(productWithVariants);
            expect(result.success).toBe(true);
        });

        it('should reject product with invalid tags (non-array)', () => {
            const invalidProduct = {
                name: 'Fresh Tomatoes',
                description: 'Locally grown fresh tomatoes',
                price: 5000,
                category: 'Farm Produce',
                stock: 100,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
                tags: 'not-an-array',
            };

            const result = createProductSchema.safeParse(invalidProduct);
            expect(result.success).toBe(false);
        });

        it('should accept product with valid tags', () => {
            const validProduct = {
                name: 'Fresh Tomatoes',
                description: 'Locally grown fresh tomatoes',
                price: 5000,
                category: 'Farm Produce',
                stock: 100,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
                tags: ['fresh', 'organic', 'local'],
            };

            const result = createProductSchema.safeParse(validProduct);
            expect(result.success).toBe(true);
        });

        it('should require minimum name length', () => {
            const invalidProduct = {
                name: 'AB',
                description: 'Locally grown fresh tomatoes',
                price: 5000,
                category: 'Farm Produce',
                stock: 100,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
            };

            const result = createProductSchema.safeParse(invalidProduct);
            expect(result.success).toBe(false);
        });

        it('should require minimum description length', () => {
            const invalidProduct = {
                name: 'Fresh Tomatoes',
                description: 'Short',
                price: 5000,
                category: 'Farm Produce',
                stock: 100,
                images: ['https://example.com/tomato.jpg'],
                vendorId: 'vendor-123',
            };

            const result = createProductSchema.safeParse(invalidProduct);
            expect(result.success).toBe(false);
        });
    });

    describe('updateProductSchema', () => {
        it('should validate partial product updates', () => {
            const partialUpdate = {
                price: 6000,
                stock: 150,
            };

            const result = updateProductSchema.safeParse(partialUpdate);
            expect(result.success).toBe(true);
        });

        it('should validate updating only name', () => {
            const nameUpdate = {
                name: 'Premium Fresh Tomatoes',
            };

            const result = updateProductSchema.safeParse(nameUpdate);
            expect(result.success).toBe(true);
        });

        it('should reject invalid partial updates', () => {
            const invalidUpdate = {
                price: -100,
            };

            const result = updateProductSchema.safeParse(invalidUpdate);
            expect(result.success).toBe(false);
        });

        it('should allow empty object (no updates)', () => {
            const emptyUpdate = {};

            const result = updateProductSchema.safeParse(emptyUpdate);
            expect(result.success).toBe(true);
        });
    });

    describe('productVariantSchema', () => {
        it('should validate correct variant data', () => {
            const validVariant = {
                name: 'Size',
                values: ['Small', 'Medium', 'Large'],
                priceAdjustment: 0,
            };

            const result = productVariantSchema.safeParse(validVariant);
            expect(result.success).toBe(true);
        });

        it('should require at least one value', () => {
            const invalidVariant = {
                name: 'Size',
                values: [],
                priceAdjustment: 0,
            };

            const result = productVariantSchema.safeParse(invalidVariant);
            expect(result.success).toBe(false);
        });

        it('should allow positive price adjustment', () => {
            const validVariant = {
                name: 'Premium',
                values: ['Yes', 'No'],
                priceAdjustment: 1000,
            };

            const result = productVariantSchema.safeParse(validVariant);
            expect(result.success).toBe(true);
        });

        it('should allow zero price adjustment', () => {
            const validVariant = {
                name: 'Color',
                values: ['Red', 'Blue'],
                priceAdjustment: 0,
            };

            const result = productVariantSchema.safeParse(validVariant);
            expect(result.success).toBe(true);
        });

        it('should allow optional price adjustment', () => {
            const variantWithoutPrice = {
                name: 'Color',
                values: ['Red', 'Blue'],
            };

            const result = productVariantSchema.safeParse(variantWithoutPrice);
            expect(result.success).toBe(true);
        });
    });
});
