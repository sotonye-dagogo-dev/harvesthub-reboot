import { describe, it, expect } from 'vitest';
import {
    createOrderSchema,
    updateOrderStatusSchema,
} from '@/lib/schemas/order.schemas';
import { OrderStatus, PaymentMethod, DeliveryMethod, PickupService } from '@/lib/constants';

describe('Order Validation Schemas', () => {
    describe('createOrderSchema', () => {
        it('should validate correct order with delivery', () => {
            const validOrder = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: 2,
                        price: 5000,
                    },
                    {
                        productId: 'prod-456',
                        quantity: 1,
                        price: 10000,
                    },
                ],
                deliveryMethod: DeliveryMethod.DELIVERY,
                addressId: 'addr-123',
                paymentMethod: PaymentMethod.WALLET,
            };

            const result = createOrderSchema.safeParse(validOrder);
            expect(result.success).toBe(true);
        });

        it('should validate correct order with pickup', () => {
            const validOrder = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: 1,
                        price: 5000,
                    },
                ],
                deliveryMethod: DeliveryMethod.PICKUP,
                pickupService: PickupService.SUNDAY_FIRST,
                paymentMethod: PaymentMethod.CARD,
            };

            const result = createOrderSchema.safeParse(validOrder);
            expect(result.success).toBe(true);
        });

        it('should reject order with empty items', () => {
            const invalidOrder = {
                items: [],
                deliveryMethod: DeliveryMethod.DELIVERY,
                addressId: 'addr-123',
                paymentMethod: PaymentMethod.WALLET,
            };

            const result = createOrderSchema.safeParse(invalidOrder);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some((issue) =>
                    issue.path.includes('items')
                )).toBe(true);
            }
        });

        it('should reject order with negative quantity', () => {
            const invalidOrder = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: -1,
                        price: 5000,
                    },
                ],
                deliveryMethod: DeliveryMethod.DELIVERY,
                addressId: 'addr-123',
                paymentMethod: PaymentMethod.WALLET,
            };

            const result = createOrderSchema.safeParse(invalidOrder);
            expect(result.success).toBe(false);
        });

        it('should reject order with zero quantity', () => {
            const invalidOrder = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: 0,
                        price: 5000,
                    },
                ],
                deliveryMethod: DeliveryMethod.DELIVERY,
                addressId: 'addr-123',
                paymentMethod: PaymentMethod.WALLET,
            };

            const result = createOrderSchema.safeParse(invalidOrder);
            expect(result.success).toBe(false);
        });

        it('should reject order with negative price', () => {
            const invalidOrder = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: 1,
                        price: -5000,
                    },
                ],
                deliveryMethod: DeliveryMethod.DELIVERY,
                addressId: 'addr-123',
                paymentMethod: PaymentMethod.WALLET,
            };

            const result = createOrderSchema.safeParse(invalidOrder);
            expect(result.success).toBe(false);
        });

        it('should require addressId for delivery orders', () => {
            const invalidOrder = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: 1,
                        price: 5000,
                    },
                ],
                deliveryMethod: DeliveryMethod.DELIVERY,
                paymentMethod: PaymentMethod.WALLET,
            };

            const result = createOrderSchema.safeParse(invalidOrder);
            expect(result.success).toBe(false);
        });

        it('should require pickupService for pickup orders', () => {
            const invalidOrder = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: 1,
                        price: 5000,
                    },
                ],
                deliveryMethod: DeliveryMethod.PICKUP,
                paymentMethod: PaymentMethod.WALLET,
            };

            const result = createOrderSchema.safeParse(invalidOrder);
            expect(result.success).toBe(false);
        });

        it('should accept valid payment methods', () => {
            const paymentMethods = [
                PaymentMethod.WALLET,
                PaymentMethod.CARD,
                PaymentMethod.BANK_TRANSFER,
                PaymentMethod.USSD,
            ];

            paymentMethods.forEach((paymentMethod) => {
                const order = {
                    items: [
                        {
                            productId: 'prod-123',
                            quantity: 1,
                            price: 5000,
                        },
                    ],
                    deliveryMethod: DeliveryMethod.DELIVERY,
                    addressId: 'addr-123',
                    paymentMethod,
                };

                const result = createOrderSchema.safeParse(order);
                expect(result.success).toBe(true);
            });
        });

        it('should accept optional notes', () => {
            const orderWithNotes = {
                items: [
                    {
                        productId: 'prod-123',
                        quantity: 1,
                        price: 5000,
                    },
                ],
                deliveryMethod: DeliveryMethod.DELIVERY,
                addressId: 'addr-123',
                paymentMethod: PaymentMethod.WALLET,
                notes: 'Please deliver in the evening',
            };

            const result = createOrderSchema.safeParse(orderWithNotes);
            expect(result.success).toBe(true);
        });

        it('should validate multiple order items', () => {
            const orderWithMultipleItems = {
                items: [
                    {
                        productId: 'prod-1',
                        quantity: 2,
                        price: 1000,
                    },
                    {
                        productId: 'prod-2',
                        quantity: 1,
                        price: 5000,
                    },
                    {
                        productId: 'prod-3',
                        quantity: 5,
                        price: 500,
                    },
                ],
                deliveryMethod: DeliveryMethod.PICKUP,
                pickupService: PickupService.MIDWEEK,
                paymentMethod: PaymentMethod.CARD,
            };

            const result = createOrderSchema.safeParse(orderWithMultipleItems);
            expect(result.success).toBe(true);
        });
    });

    describe('updateOrderStatusSchema', () => {
        it('should validate status update', () => {
            const validUpdate = {
                status: OrderStatus.CONFIRMED,
            };

            const result = updateOrderStatusSchema.safeParse(validUpdate);
            expect(result.success).toBe(true);
        });

        it('should validate status update with notes', () => {
            const validUpdate = {
                status: OrderStatus.CANCELLED,
                notes: 'Customer requested cancellation',
            };

            const result = updateOrderStatusSchema.safeParse(validUpdate);
            expect(result.success).toBe(true);
        });

        it('should accept all valid order statuses', () => {
            const statuses = [
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.READY_FOR_PICKUP,
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED,
                OrderStatus.REFUNDED,
            ];

            statuses.forEach((status) => {
                const update = { status };
                const result = updateOrderStatusSchema.safeParse(update);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid status values', () => {
            const invalidUpdate = {
                status: 'INVALID_STATUS',
            };

            const result = updateOrderStatusSchema.safeParse(invalidUpdate);
            expect(result.success).toBe(false);
        });

        it('should require status field', () => {
            const invalidUpdate = {
                notes: 'Some notes without status',
            };

            const result = updateOrderStatusSchema.safeParse(invalidUpdate);
            expect(result.success).toBe(false);
        });

        it('should allow optional notes', () => {
            const updateWithoutNotes = {
                status: OrderStatus.PROCESSING,
            };

            const result = updateOrderStatusSchema.safeParse(updateWithoutNotes);
            expect(result.success).toBe(true);
        });
    });
});
