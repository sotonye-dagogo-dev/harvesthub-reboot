import { describe, it, expect } from 'vitest';
import {
    depositSchema,
    withdrawalSchema,
    addressSchema,
    updateAddressSchema,
    createReviewSchema,
    updateReviewSchema,
} from '@/lib/schemas/misc.schemas';
import { PaymentMethod } from '@/lib/constants';

describe('Wallet Validation Schemas', () => {
    describe('depositSchema', () => {
        it('should validate correct deposit data', () => {
            const validDeposit = {
                amount: 5000,
                paymentMethod: PaymentMethod.CARD,
            };

            const result = depositSchema.safeParse(validDeposit);
            expect(result.success).toBe(true);
        });

        it('should reject deposit below minimum (100 NGN)', () => {
            const invalidDeposit = {
                amount: 50,
                paymentMethod: PaymentMethod.CARD,
            };

            const result = depositSchema.safeParse(invalidDeposit);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some((issue) =>
                    issue.path.includes('amount')
                )).toBe(true);
            }
        });

        it('should reject negative amount', () => {
            const invalidDeposit = {
                amount: -1000,
                paymentMethod: PaymentMethod.CARD,
            };

            const result = depositSchema.safeParse(invalidDeposit);
            expect(result.success).toBe(false);
        });

        it('should reject zero amount', () => {
            const invalidDeposit = {
                amount: 0,
                paymentMethod: PaymentMethod.CARD,
            };

            const result = depositSchema.safeParse(invalidDeposit);
            expect(result.success).toBe(false);
        });

        it('should accept valid payment methods', () => {
            const paymentMethods = [
                PaymentMethod.CARD,
                PaymentMethod.BANK_TRANSFER,
                PaymentMethod.USSD,
            ];

            paymentMethods.forEach((paymentMethod) => {
                const deposit = {
                    amount: 5000,
                    paymentMethod,
                };

                const result = depositSchema.safeParse(deposit);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('withdrawalSchema', () => {
        it('should validate correct withdrawal data', () => {
            const validWithdrawal = {
                amount: 10000,
                bankName: 'First Bank',
                accountNumber: '1234567890',
                accountName: 'John Doe',
            };

            const result = withdrawalSchema.safeParse(validWithdrawal);
            expect(result.success).toBe(true);
        });

        it('should reject withdrawal below minimum (500 NGN)', () => {
            const invalidWithdrawal = {
                amount: 200,
                bankName: 'First Bank',
                accountNumber: '1234567890',
                accountName: 'John Doe',
            };

            const result = withdrawalSchema.safeParse(invalidWithdrawal);
            expect(result.success).toBe(false);
        });

        it('should reject invalid account number (not 10 digits)', () => {
            const invalidWithdrawal = {
                amount: 10000,
                bankName: 'First Bank',
                accountNumber: '12345',
                accountName: 'John Doe',
            };

            const result = withdrawalSchema.safeParse(invalidWithdrawal);
            expect(result.success).toBe(false);
        });

        it('should require bank name', () => {
            const invalidWithdrawal = {
                amount: 10000,
                accountNumber: '1234567890',
                accountName: 'John Doe',
            };

            const result = withdrawalSchema.safeParse(invalidWithdrawal);
            expect(result.success).toBe(false);
        });

        it('should require account name', () => {
            const invalidWithdrawal = {
                amount: 10000,
                bankName: 'First Bank',
                accountNumber: '1234567890',
            };

            const result = withdrawalSchema.safeParse(invalidWithdrawal);
            expect(result.success).toBe(false);
        });
    });
});

describe('Address Validation Schemas', () => {
    describe('addressSchema', () => {
        it('should validate correct address data', () => {
            const validAddress = {
                fullName: 'John Doe',
                phoneNumber: '08012345678',
                address: '123 Main Street',
                city: 'Lagos',
                state: 'Lagos',
                campus: 'GBAGADA',
            };

            const result = addressSchema.safeParse(validAddress);
            expect(result.success).toBe(true);
        });

        it('should validate Nigerian phone numbers', () => {
            const validPhones = [
                '08012345678',
                '07012345678',
                '+2348012345678',
            ];

            validPhones.forEach((phoneNumber) => {
                const address = {
                    fullName: 'John Doe',
                    phoneNumber,
                    address: '123 Main Street',
                    city: 'Lagos',
                    state: 'Lagos',
                    campus: 'GBAGADA',
                };

                const result = addressSchema.safeParse(address);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid phone numbers', () => {
            const invalidPhones = [
                '123456',
                'not-a-number',
                '+1234567890',
            ];

            invalidPhones.forEach((phoneNumber) => {
                const address = {
                    fullName: 'John Doe',
                    phoneNumber,
                    address: '123 Main Street',
                    city: 'Lagos',
                    state: 'Lagos',
                    campus: 'GBAGADA',
                };

                const result = addressSchema.safeParse(address);
                expect(result.success).toBe(false);
            });
        });

        it('should accept optional delivery instructions', () => {
            const addressWithInstructions = {
                fullName: 'John Doe',
                phoneNumber: '08012345678',
                address: '123 Main Street',
                city: 'Lagos',
                state: 'Lagos',
                campus: 'GBAGADA',
                deliveryInstructions: 'Call when you arrive',
            };

            const result = addressSchema.safeParse(addressWithInstructions);
            expect(result.success).toBe(true);
        });

        it('should require all mandatory fields', () => {
            const requiredFields = ['fullName', 'phoneNumber', 'address', 'city', 'state'];

            requiredFields.forEach((field) => {
                const incompleteAddress = {
                    fullName: 'John Doe',
                    phoneNumber: '08012345678',
                    address: '123 Main Street',
                    city: 'Lagos',
                    state: 'Lagos',
                    campus: 'GBAGADA',
                };

                delete incompleteAddress[field as keyof typeof incompleteAddress];

                const result = addressSchema.safeParse(incompleteAddress);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('updateAddressSchema', () => {
        it('should validate address updates', () => {
            const validUpdate = {
                id: 'addr-123',
                address: '456 New Street',
                city: 'Ikeja',
            };

            const result = updateAddressSchema.safeParse(validUpdate);
            expect(result.success).toBe(true);
        });

        it('should allow partial updates', () => {
            const partialUpdate = {
                id: 'addr-123',
                phoneNumber: '08087654321',
            };

            const result = updateAddressSchema.safeParse(partialUpdate);
            expect(result.success).toBe(true);
        });
    });
});

describe('Review Validation Schemas', () => {
    describe('createReviewSchema', () => {
        it('should validate correct review data', () => {
            const validReview = {
                productId: 'prod-123',
                orderId: 'order-123',
                rating: 5,
                comment: 'Excellent product! Highly recommended.',
            };

            const result = createReviewSchema.safeParse(validReview);
            expect(result.success).toBe(true);
        });

        it('should reject rating below 1', () => {
            const invalidReview = {
                productId: 'prod-123',
                orderId: 'order-123',
                rating: 0,
                comment: 'Bad product',
            };

            const result = createReviewSchema.safeParse(invalidReview);
            expect(result.success).toBe(false);
        });

        it('should reject rating above 5', () => {
            const invalidReview = {
                productId: 'prod-123',
                orderId: 'order-123',
                rating: 6,
                comment: 'Excellent product',
            };

            const result = createReviewSchema.safeParse(invalidReview);
            expect(result.success).toBe(false);
        });

        it('should accept ratings from 1 to 5', () => {
            const ratings = [1, 2, 3, 4, 5];

            ratings.forEach((rating) => {
                const review = {
                    productId: 'prod-123',
                    orderId: 'order-123',
                    rating,
                    comment: 'Test review',
                };

                const result = createReviewSchema.safeParse(review);
                expect(result.success).toBe(true);
            });
        });

        it('should require minimum comment length', () => {
            const invalidReview = {
                productId: 'prod-123',
                orderId: 'order-123',
                rating: 5,
                comment: 'OK',
            };

            const result = createReviewSchema.safeParse(invalidReview);
            expect(result.success).toBe(false);
        });

        it('should accept reviews with images', () => {
            const reviewWithImages = {
                productId: 'prod-123',
                orderId: 'order-123',
                rating: 5,
                comment: 'Excellent product! Here are some photos.',
                images: [
                    'https://example.com/review1.jpg',
                    'https://example.com/review2.jpg',
                ],
            };

            const result = createReviewSchema.safeParse(reviewWithImages);
            expect(result.success).toBe(true);
        });

        it('should require productId', () => {
            const invalidReview = {
                rating: 5,
                comment: 'Great product',
            };

            const result = createReviewSchema.safeParse(invalidReview);
            expect(result.success).toBe(false);
        });
    });

    describe('updateReviewSchema', () => {
        it('should validate review updates', () => {
            const validUpdate = {
                reviewId: 'review-123',
                rating: 4,
                comment: 'Updated my review after using it more',
            };

            const result = updateReviewSchema.safeParse(validUpdate);
            expect(result.success).toBe(true);
        });

        it('should allow updating only rating', () => {
            const ratingUpdate = {
                reviewId: 'review-123',
                rating: 3,
            };

            const result = updateReviewSchema.safeParse(ratingUpdate);
            expect(result.success).toBe(true);
        });

        it('should allow updating only comment', () => {
            const commentUpdate = {
                reviewId: 'review-123',
                comment: 'Changed my mind, this is a great product!',
            };

            const result = updateReviewSchema.safeParse(commentUpdate);
            expect(result.success).toBe(true);
        });

        it('should reject invalid rating in update', () => {
            const invalidUpdate = {
                reviewId: 'review-123',
                rating: 10,
            };

            const result = updateReviewSchema.safeParse(invalidUpdate);
            expect(result.success).toBe(false);
        });
    });
});
