/**
 * POST /api/cart/items — Add item to cart
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { ListingType } from '@prisma/client';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.BUYER) return NextResponse.json({ error: 'Buyers only' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { productId, quantity = 1 } = body;

        if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
        if (typeof quantity !== 'number' || quantity < 1) return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product || !product.isActive) return NextResponse.json({ error: 'Product not found or inactive' }, { status: 404 });

        // Services are capped at qty 1
        const effectiveQty = product.listingType === ListingType.SERVICE ? 1 : quantity;

        if (product.listingType !== ListingType.SERVICE && product.stock < effectiveQty) {
            return NextResponse.json({ error: 'Insufficient stock', available: product.stock }, { status: 400 });
        }

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

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
                return NextResponse.json({ error: 'Insufficient stock for requested quantity', available: product.stock }, { status: 400 });
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

        return NextResponse.json({ success: true, cart: updatedCart });
    } catch (error) {
        console.error('POST /api/cart/items error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
