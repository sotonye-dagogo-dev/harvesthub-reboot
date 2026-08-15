/**
 * Cart & Order Flow Integration Tests
 * Tests the complete buyer journey: cart → checkout → order → payment
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Requires a running dev server (npm run dev) with a seeded database.
// Run explicitly with: RUN_INTEGRATION=1 npx vitest run lib/__tests__/api
const runIntegration = process.env.RUN_INTEGRATION === '1';

let authToken: string;
let orderId: string;

describe.skipIf(!runIntegration)('Cart & Order Flow Integration Tests', () => {
    beforeAll(async () => {
        // Login to get auth token
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
        authToken = loginData.accessToken;
    });

    describe('Cart Operations', () => {
        it('should get or create cart for buyer', async () => {
            const response = await fetch('http://localhost:3000/api/cart', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.cart).toBeDefined();
        });

        it('should add item to cart', async () => {
            const newItem = {
                productId: 'prod-001',
                quantity: 2,
            };

            const response = await fetch('http://localhost:3000/api/cart/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(newItem),
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.cart.items).toBeInstanceOf(Array);
            expect(data.cart.items.length).toBeGreaterThan(0);
        });

        it('should update cart item quantity', async () => {
            const response = await fetch('http://localhost:3000/api/cart/items/prod-001', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ quantity: 3 }),
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
        });

        it('should remove item from cart', async () => {
            const response = await fetch('http://localhost:3000/api/cart/items/prod-001', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
        });

        it('should clear entire cart', async () => {
            // First add an item
            await fetch('http://localhost:3000/api/cart/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    productId: 'prod-002',
                    quantity: 1,
                }),
            });

            // Then clear cart
            const response = await fetch('http://localhost:3000/api/cart/clear', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.cart.items).toEqual([]);
        });
    });

    describe('Order Creation & Management', () => {
        beforeAll(async () => {
            // Add items to cart before creating order
            await fetch('http://localhost:3000/api/cart/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    productId: 'prod-001',
                    quantity: 2,
                }),
            });
        });

        it('should create order from cart', async () => {
            const orderData = {
                deliveryMethod: 'DELIVERY',
                addressId: 'addr-001',
                paymentMethod: 'WALLET',
                notes: 'Test order',
            };

            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(orderData),
            });

            expect(response.status).toBe(201);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.order).toBeDefined();
            expect(data.order.status).toBe('PENDING');
            orderId = data.order.id;
        });

        it('should get order details', async () => {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.order.id).toBe(orderId);
        });

        it('should get buyer order history', async () => {
            const response = await fetch('http://localhost:3000/api/orders', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.orders).toBeInstanceOf(Array);
        });

        it('should cancel order', async () => {
            const response = await fetch(`http://localhost:3000/api/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ reason: 'Changed mind' }),
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.order.status).toBe('CANCELLED');
        });
    });

    describe('Wallet Integration', () => {
        it('should get wallet balance', async () => {
            const response = await fetch('http://localhost:3000/api/wallet', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.wallet).toBeDefined();
            expect(typeof data.wallet.balance).toBe('number');
        });

        it('should get wallet transactions', async () => {
            const response = await fetch('http://localhost:3000/api/wallet/transactions', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.transactions).toBeInstanceOf(Array);
        });

        it('should deposit funds to wallet', async () => {
            const depositData = {
                amount: 5000,
                paymentMethod: 'CARD',
            };

            const response = await fetch('http://localhost:3000/api/wallet/deposit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(depositData),
            });

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.wallet.balance).toBeGreaterThanOrEqual(5000);
        });
    });
});
