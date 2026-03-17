import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword as comparePassword } from '@/lib/utils/password';

// Minimal Prisma-backed adapter for key data operations.
// Start with user operations. Expand other adapters incrementally.

export const userDb = {
    findAll: async () => {
        return prisma.user.findMany();
    },

    findById: async (id: string) => {
        return prisma.user.findUnique({ where: { id } });
    },

    findByEmail: async (email: string) => {
        if (!email) return null;
        return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    },

    findByRole: async (role: any) => {
        return prisma.user.findMany({ where: { role } });
    },

    create: async (data: any, password: string) => {
        const hashed = await hashPassword(password);
        return prisma.user.create({
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
        });
    },

    update: async (id: string, data: any) => {
        return prisma.user.update({ where: { id }, data });
    },

    delete: async (id: string) => {
        await prisma.user.delete({ where: { id } });
        return true;
    },

    verifyPassword: async (userId: string, password: string) => {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return false;
        return comparePassword(password, user.password);
    },

    updatePassword: async (userId: string, newPassword: string) => {
        const hashed = await hashPassword(newPassword);
        await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        return true;
    },
};

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

        return prisma.product.findMany({ where, take, skip, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] });
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
        return prisma.product.count({ where });
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
};

export const bannerDb = {
    findAll: async (filters?: any) => {
        const where: any = {};
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.position) where.position = filters.position;
        if (filters?.theme) where.theme = filters.theme;
        const take = filters?.limit ?? undefined;
        const skip = filters?.page && filters.limit ? (filters.page - 1) * filters.limit : undefined;
        return prisma.banner.findMany({ where, take, skip, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] });
    },

    count: async (filters?: any) => {
        const where: any = {};
        if (filters?.isActive !== undefined) where.isActive = filters.isActive;
        if (filters?.position) where.position = filters.position;
        if (filters?.theme) where.theme = filters.theme;
        return prisma.banner.count({ where });
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
};

export const orderDb = {
    findAll: async (filters?: any) => {
        const where: any = {};
        if (filters?.buyerId) where.buyerId = filters.buyerId;
        if (filters?.vendorId) where.vendorId = filters.vendorId;
        if (filters?.status) where.status = filters.status;
        const take = filters?.limit ?? undefined;
        const skip = filters?.page && filters.limit ? (filters.page - 1) * filters.limit : undefined;
        return prisma.order.findMany({ where, take, skip, orderBy: [{ createdAt: 'desc' }] });
    },

    count: async (filters?: any) => {
        const where: any = {};
        if (filters?.buyerId) where.buyerId = filters.buyerId;
        if (filters?.vendorId) where.vendorId = filters.vendorId;
        if (filters?.status) where.status = filters.status;
        return prisma.order.count({ where });
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
};

const prismaAdapter = {
    userDb,
    productDb,
    bannerDb,
    orderDb,
};

export default prismaAdapter;
