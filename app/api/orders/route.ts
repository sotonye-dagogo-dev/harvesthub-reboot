import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { OrderStatus, PaymentStatus, UserRole } from "@/lib/constants";

async function getAuthUser(_request: NextRequest) {
    const { cookies } = await import("next/headers");
    const { verifyToken } = await import("@/lib/utils/auth");
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;
    return db.users.findById(payload.userId);
}

// GET /api/orders - Get orders (filtered by user role)
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as OrderStatus | null;
        const paymentStatus = searchParams.get("paymentStatus") as PaymentStatus | null;
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

        const filters: Parameters<typeof db.orders.findAll>[0] = {};

        if (status) filters.status = status;
        if (paymentStatus) filters.paymentStatus = paymentStatus;
        if (page) filters.page = page;
        if (limit) filters.limit = limit;

        // Role-based filtering
        if (user.role === UserRole.BUYER) {
            const buyer = db.buyers.findByUserId(user.id);
            if (!buyer) {
                return NextResponse.json({ success: true, orders: [] });
            }
            filters.buyerId = buyer.id;
        } else if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(user.id);
            if (!vendor) {
                return NextResponse.json({ success: true, orders: [] });
            }
            filters.vendorId = vendor.id;
        }
        // ADMIN can see all orders

        const orders = db.orders.findAll(filters);

        // Enrich with vendor/buyer info
        const enrichedOrders = Array.isArray(orders)
            ? orders.map((order) => {
                const vendor = db.vendors.findById(order.vendorId);
                const buyer = db.buyers.findById(order.buyerId);
                const buyerUser = buyer ? db.users.findById(buyer.userId) : undefined;
                return { ...order, vendor, buyerUser };
            })
            : {
                ...orders,
                data: orders.data.map((order) => {
                    const vendor = db.vendors.findById(order.vendorId);
                    const buyer = db.buyers.findById(order.buyerId);
                    const buyerUser = buyer ? db.users.findById(buyer.userId) : undefined;
                    return { ...order, vendor, buyerUser };
                }),
            };

        return NextResponse.json({ success: true, orders: enrichedOrders });
    } catch (error) {
        console.error("Get orders error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

// POST /api/orders - Create a new order (buyer only)
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (user.role !== UserRole.BUYER) {
            return NextResponse.json(
                { error: "Only buyers can create orders" },
                { status: 403 }
            );
        }

        const buyer = db.buyers.findByUserId(user.id);
        if (!buyer) {
            return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
        }

        const body = await request.json();

        // Validate required fields
        const { vendorId, items, paymentMethod, deliveryMethod, deliveryAddress, pickupDetails, notes } = body;

        if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "vendorId and items are required" },
                { status: 400 }
            );
        }

        const vendor = db.vendors.findById(vendorId);
        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = items.map((item: { productId: string; quantity: number; selectedVariants?: Record<string, string> }) => {
            const product = db.products.findById(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;
            return {
                id: `order-item-${Date.now()}-${Math.random()}`,
                orderId: "",
                productId: product.id,
                productName: product.name,
                productImage: product.mainImage,
                quantity: item.quantity,
                selectedVariants: item.selectedVariants,
                price: product.price,
                subtotal: itemSubtotal,
            };
        });

        const deliveryFee =
            deliveryMethod === "DELIVERY" ? (vendor.storeSettings?.allowsDelivery ? 1000 : 0) : 0;
        const total = subtotal + deliveryFee;

        const order = db.orders.create({
            buyerId: buyer.id,
            vendorId,
            status: OrderStatus.PENDING,
            items: orderItems,
            subtotal,
            deliveryFee,
            total,
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod,
            deliveryMethod,
            deliveryAddress: deliveryAddress ?? null,
            pickupDetails: pickupDetails ?? null,
            notes: notes ?? null,
            statusHistory: [
                {
                    status: OrderStatus.PENDING,
                    timestamp: new Date(),
                    updatedBy: user.id,
                },
            ],
        });

        return NextResponse.json({ success: true, order }, { status: 201 });
    } catch (error) {
        console.error("Create order error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
