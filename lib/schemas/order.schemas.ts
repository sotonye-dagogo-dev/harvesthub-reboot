/**
 * Order and Cart Validation Schemas
 * Zod schemas for order creation, cart operations
 */

import { z } from 'zod';
import { DeliveryMethod, PickupService, Campus, PaymentMethod, OrderStatus } from '@/lib/constants';

// ============================================================================
// CART ITEM SCHEMA
// ============================================================================

export const addToCartSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
    selectedVariants: z.record(z.string(), z.string()).optional().nullable(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
    cartItemId: z.string().min(1, 'Cart item ID is required'),
    quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// ============================================================================
// PICKUP DETAILS SCHEMA
// ============================================================================

export const pickupDetailsSchema = z.object({
    campus: z.nativeEnum(Campus, {
        errorMap: () => ({ message: 'Please select a pickup campus' }),
    }),
    service: z.nativeEnum(PickupService, {
        errorMap: () => ({ message: 'Please select a pickup service' }),
    }),
    contactPhone: z.string().min(1, 'Contact phone number is required'),
    specialInstructions: z.string().max(500, 'Instructions too long').optional().nullable(),
});

export type PickupDetailsInput = z.infer<typeof pickupDetailsSchema>;

// ============================================================================
// CREATE ORDER SCHEMA
// ============================================================================

export const createOrderSchema = z
    .object({
        items: z
            .array(
                z.object({
                    productId: z.string().min(1, 'Product ID is required'),
                    quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
                    price: z.number().positive('Price must be positive'),
                    selectedVariants: z.record(z.string(), z.string()).optional().nullable(),
                })
            )
            .min(1, 'At least one item is required'),
        deliveryMethod: z.nativeEnum(DeliveryMethod, {
            errorMap: () => ({ message: 'Please select a delivery method' }),
        }),
        paymentMethod: z.nativeEnum(PaymentMethod, {
            errorMap: () => ({ message: 'Please select a payment method' }),
        }),
        addressId: z.string().optional().nullable(),
        pickupService: z.nativeEnum(PickupService).optional().nullable(),
        pickupDetails: pickupDetailsSchema.optional().nullable(),
        notes: z.string().max(1000, 'Notes too long').optional().nullable(),
    })
    .refine(
        (data) => {
            if (data.deliveryMethod === DeliveryMethod.DELIVERY && !data.addressId) {
                return false;
            }
            return true;
        },
        {
            message: 'Address is required for delivery',
            path: ['addressId'],
        }
    )
    .refine(
        (data) => {
            if (
                data.deliveryMethod === DeliveryMethod.PICKUP &&
                !data.pickupDetails &&
                !data.pickupService
            ) {
                return false;
            }
            return true;
        },
        {
            message: 'Pickup details or pickup service are required for pickup orders',
            path: ['pickupDetails'],
        }
    );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================================================
// UPDATE ORDER STATUS SCHEMA
// ============================================================================

export const updateOrderStatusSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required').optional(),
    status: z.nativeEnum(OrderStatus, {
        errorMap: () => ({ message: 'Invalid order status' }),
    }),
    notes: z.string().max(500, 'Notes too long').optional().nullable(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ============================================================================
// CANCEL ORDER SCHEMA
// ============================================================================

export const cancelOrderSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    reason: z.string().min(10, 'Please provide a reason for cancellation (at least 10 characters)').max(500, 'Reason too long'),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
