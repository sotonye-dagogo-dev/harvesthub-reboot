import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword as comparePassword } from '@/lib/utils/password';
import type { CrudAdapter } from '@/lib/data/adapterTypes';

async function withPrismaReconnect<T>(action: () => Promise<T>): Promise<T> {
    try {
        return await action();
    } catch (error: any) {
        const message = String(error?.message ?? error);
        if (
            message.includes('Server has closed the connection') ||
            message.includes('Connection is closed') ||
            message.includes('Closed connection') ||
            message.includes('socket hang up') ||
            message.includes('ECONNRESET')
        ) {
            console.warn('[Prisma] Connection closed, attempting reconnect:', message);
            try {
                await prisma.$disconnect();
            } catch (disconnectErr) {
                console.warn('[Prisma] Error while disconnecting:', disconnectErr);
            }
            try {
                await prisma.$connect();
            } catch (connectErr) {
                console.error('[Prisma] Reconnect failed:', connectErr);
                throw error;
            }
            return action();
        }
        throw error;
    }
}

// Minimal Prisma-backed adapter for key data operations.
// Start with user operations. Expand other adapters incrementally.

export const userDb = {
    findAll: async () => {
        return withPrismaReconnect(() => prisma.user.findMany());
    },

    findById: async (id: string) => {
        return withPrismaReconnect(() => prisma.user.findUnique({ where: { id } }));
    },

    findByEmail: async (email: string) => {
        if (!email) return null;
        return withPrismaReconnect(() =>
            prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
        );
    },

    findByRole: async (role: any) => {
        return withPrismaReconnect(() => prisma.user.findMany({ where: { role } }));
    },

    create: async (data: any, password: string) => {
        const hashed = await hashPassword(password);
        return withPrismaReconnect(() =>
            prisma.user.create({
                data: {
                    email: data.email.toLowerCase().trim(),
                    password: hashed,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phoneNumber: data.phoneNumber,
                    role: data.role ?? 'BUYER',
                    profilePicture: data.profilePicture,
                    emailVerified: data.emailVerified ?? false,
                    isActive: data.isActive ?? true,
                },
            })
        );
    },

    update: async (id: string, data: any) => {
        return withPrismaReconnect(() => prisma.user.update({ where: { id }, data }));
    },

    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.user.delete({ where: { id } }));
        return true;
    },

    verifyPassword: async (userId: string, password: string) => {
        const user = await withPrismaReconnect(() => prisma.user.findUnique({ where: { id: userId } }));
        if (!user) return false;
        return comparePassword(password, user.password);
    },

    updatePassword: async (userId: string, newPassword: string) => {
        const hashed = await hashPassword(newPassword);
        await withPrismaReconnect(() =>
            prisma.user.update({ where: { id: userId }, data: { password: hashed } })
        );
        return true;
    },
} satisfies CrudAdapter<any, any, any, [string]>;

// single default export at end of file

export const productDb = {
    findAll: async (filters?: any) => {
        const where: any = {};
        if (filters?.vendorId) where.vendorId = filters.vendorId;
        if (filters?.category) where.category = filters.category;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const take = filters?.limit ?? undefined;
        const skip = filters?.page && filters.limit ? (filters.page - 1) * filters.limit : undefined;

        return withPrismaReconnect(() =>
            prisma.product.findMany({ where, take, skip, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] })
        );
    },

    count: async (filters?: any) => {
        const where: any = {};
        if (filters?.vendorId) where.vendorId = filters.vendorId;
        if (filters?.category) where.category = filters.category;
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return withPrismaReconnect(() => prisma.product.count({ where }));
    },

    findById: async (id: string) => {
        return prisma.product.findUnique({ where: { id } });
    },

    findByVendor: async (vendorId: string) => {
        return prisma.product.findMany({ where: { vendorId } });
    },

    create: async (data: any) => {
        return prisma.product.create({ data });
    },

    update: async (id: string, data: any) => {
        return prisma.product.update({ where: { id }, data });
    },

    delete: async (id: string) => {
        await prisma.product.delete({ where: { id } });
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const bannerDb = {
    findAll: async (filters?: any) => {
        const where: any = {};
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.position) where.position = filters.position;
        if (filters?.theme) where.theme = filters.theme;
        const take = filters?.limit ?? undefined;
        const skip = filters?.page && filters.limit ? (filters.page - 1) * filters.limit : undefined;
        return withPrismaReconnect(() =>
            prisma.banner.findMany({ where, take, skip, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] })
        );
    },

    count: async (filters?: any) => {
        const where: any = {};
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.position) where.position = filters.position;
        if (filters?.theme) where.theme = filters.theme;
        return withPrismaReconnect(() => prisma.banner.count({ where }));
    },

    findById: async (id: string) => {
        return prisma.banner.findUnique({ where: { id } });
    },

    create: async (data: any) => {
        return prisma.banner.create({ data });
    },

    update: async (id: string, data: any) => {
        return prisma.banner.update({ where: { id }, data });
    },

    delete: async (id: string) => {
        await prisma.banner.delete({ where: { id } });
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const orderDb = {
    findAll: async (filters?: any) => {
        const where: any = {};
        if (filters?.buyerId) where.buyerId = filters.buyerId;
        if (filters?.vendorId) where.vendorId = filters.vendorId;
        if (filters?.status) where.status = filters.status;
        const take = filters?.limit ?? undefined;
        const skip = filters?.page && filters.limit ? (filters.page - 1) * filters.limit : undefined;
        return withPrismaReconnect(() =>
            prisma.order.findMany({ where, take, skip, orderBy: [{ createdAt: 'desc' }] })
        );
    },
    count: async (filters?: any) => {
        const where: any = {};
        if (filters?.buyerId) where.buyerId = filters.buyerId;
        if (filters?.vendorId) where.vendorId = filters.vendorId;
        if (filters?.status) where.status = filters.status;
        return withPrismaReconnect(() => prisma.order.count({ where }));
    },

    findById: async (id: string) => {
        return prisma.order.findUnique({ where: { id } });
    },

    findByUserId: async (buyerId: string) => {
        return prisma.order.findMany({ where: { buyerId } });
    },

    findByVendorId: async (vendorId: string) => {
        return prisma.order.findMany({ where: { vendorId } });
    },

    create: async (data: any) => {
        return prisma.order.create({ data });
    },

    update: async (id: string, data: any) => {
        return prisma.order.update({ where: { id }, data });
    },

    delete: async (id: string) => {
        await prisma.order.delete({ where: { id } });
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const buyerDb = {
    findAll: async () => withPrismaReconnect(() => prisma.buyer.findMany()),
    findById: async (id: string) => withPrismaReconnect(() => prisma.buyer.findUnique({ where: { id } })),
    findByUserId: async (userId: string) => withPrismaReconnect(() => prisma.buyer.findUnique({ where: { userId } })),
    create: async (data: any) => withPrismaReconnect(() => prisma.buyer.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.buyer.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.buyer.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;
export const adApplicationDb = {
    findAll: async (filters?: any) => {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.userId) where.userId = filters.userId;
        const take = filters?.limit ?? undefined;
        const skip = filters?.page && filters.limit ? (filters.page - 1) * filters.limit : undefined;
        return withPrismaReconnect(() =>
            prisma.adApplication.findMany({ where, take, skip, orderBy: [{ createdAt: 'desc' }] })
        );
    },

    findById: async (id: string) => {
        return withPrismaReconnect(() => prisma.adApplication.findUnique({ where: { id } }));
    },

    create: async (data: any) => {
        return withPrismaReconnect(() => prisma.adApplication.create({ data }));
    },

    update: async (id: string, data: any) => {
        return withPrismaReconnect(() => prisma.adApplication.update({ where: { id }, data }));
    },

    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.adApplication.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const adRateConfigDb = {
    findAll: async () => withPrismaReconnect(() => prisma.adRateConfig.findMany()),
    findById: async (id: string) => withPrismaReconnect(() => prisma.adRateConfig.findUnique({ where: { id } })),
    create: async (data: any) => withPrismaReconnect(() => prisma.adRateConfig.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.adRateConfig.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.adRateConfig.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const vendorDb = {
    findAll: async (filters?: any) => {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.campus) where.campus = filters.campus;
        if (filters?.category) where.category = filters.category;
        const take = filters?.limit ?? undefined;
        const skip = filters?.page && filters.limit ? (filters.page - 1) * filters.limit : undefined;
        return withPrismaReconnect(() => prisma.vendor.findMany({ where, take, skip, orderBy: [{ createdAt: 'desc' }] }));
    },
    findById: async (id: string) => withPrismaReconnect(() => prisma.vendor.findUnique({ where: { id } })),
    findByUserId: async (userId: string) => withPrismaReconnect(() => prisma.vendor.findUnique({ where: { userId } })),
    create: async (data: any) => withPrismaReconnect(() => prisma.vendor.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.vendor.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.vendor.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const cartDb = {
    findByBuyerId: async (buyerId: string) =>
        withPrismaReconnect(() => prisma.cart.findUnique({ where: { buyerId }, include: { items: true } })),

    create: async (data: any) => withPrismaReconnect(() => prisma.cart.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.cart.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.cart.delete({ where: { id } }));
        return true;
    },
    clear: async (buyerId: string) => {
        const cart = await withPrismaReconnect(() => prisma.cart.findUnique({ where: { buyerId } }));
        if (!cart) return null;
        await withPrismaReconnect(() => prisma.cartItem.deleteMany({ where: { cartId: cart.id } }));
        return withPrismaReconnect(() => prisma.cart.update({ where: { id: cart.id }, data: { subtotal: 0 } }));
    },
} satisfies CrudAdapter<any, any, any>;

export const walletDb = {
    findByUserId: async (userId: string) =>
        withPrismaReconnect(() => prisma.wallet.findUnique({ where: { userId }, include: { transactions: true } })),
    create: async (data: any) => withPrismaReconnect(() => prisma.wallet.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.wallet.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.wallet.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const transactionDb = {
    findByWalletId: async (walletId: string) =>
        withPrismaReconnect(() => prisma.transaction.findMany({ where: { walletId }, orderBy: { createdAt: 'desc' } })),
    create: async (data: any) => withPrismaReconnect(() => prisma.transaction.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.transaction.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.transaction.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const reviewDb = {
    findByProductId: async (productId: string) =>
        withPrismaReconnect(() => prisma.review.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } })),
    findByUserId: async (userId: string) =>
        withPrismaReconnect(() => prisma.review.findMany({ where: { buyerId: userId }, orderBy: { createdAt: 'desc' } })),
    create: async (data: any) => withPrismaReconnect(() => prisma.review.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.review.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.review.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

export const addressDb = {
    findByUserId: async (userId: string) =>
        withPrismaReconnect(() => prisma.address.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })),
    create: async (data: any) => withPrismaReconnect(() => prisma.address.create({ data })),
    update: async (id: string, data: any) => withPrismaReconnect(() => prisma.address.update({ where: { id }, data })),
    delete: async (id: string) => {
        await withPrismaReconnect(() => prisma.address.delete({ where: { id } }));
        return true;
    },
} satisfies CrudAdapter<any, any, any>;

const prismaAdapter = {
    userDb,
    productDb,
    bannerDb,
    adApplicationDb,
    adRateConfigDb,
    orderDb,
    buyerDb,
    vendorDb,
    cartDb,
    walletDb,
    transactionDb,
    reviewDb,
    addressDb,
};

export default prismaAdapter;
