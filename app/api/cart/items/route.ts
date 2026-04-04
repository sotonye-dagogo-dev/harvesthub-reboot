/**
 * POST /api/cart/items — Add item to cart
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { ListingType } from '../../../../prisma/generated/client';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/cart/items', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.BUYER) return apiError('Buyers only', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { productId, quantity = 1 } = body;

        if (!productId) return apiError('productId is required', 400);
        if (typeof quantity !== 'number' || quantity < 1) return apiError('Quantity must be at least 1', 400);

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) return apiError('Product not found or inactive', 404);

        // Services are capped at qty 1
        const effectiveQty = product.listingType === ListingType.SERVICE ? 1 : quantity;

        if (product.listingType !== ListingType.SERVICE && product.stock < effectiveQty) {
            return apiError('Insufficient stock', 400, { available: product.stock });
        }

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return apiError('Buyer not found', 404);

        // Get or create cart
        let cart = await prisma.cart.findUnique({ where: { buyerId: buyer.id } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { buyerId: buyer.id, subtotal: 0 } });
        }

        // Check if item already in cart
        const existing = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId },
        });

        if (existing) {
            const newQty = product.listingType === ListingType.SERVICE ? 1 : existing.quantity + effectiveQty;
            if (product.listingType !== ListingType.SERVICE && product.stock < newQty) {
                return apiError('Insufficient stock for requested quantity', 400, { available: product.stock });
            }
            await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: newQty, price: product.price, subtotal: product.price * newQty },
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity: effectiveQty,
                    price: product.price,
                    subtotal: product.price * effectiveQty,
                },
            });
        }

        // Recalculate subtotal
        const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await prisma.cart.update({ where: { id: cart.id }, data: { subtotal } });

        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: { product: { include: { vendor: { select: { id: true, storeName: true, storeLogo: true } } } } },
                    orderBy: { addedAt: 'desc' },
                },
            },
        });

        return apiSuccess({ cart: updatedCart });
    });
}
