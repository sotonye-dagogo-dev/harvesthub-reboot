import { PrismaClient } from '../../prisma/generated/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
    const log = process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

    // When DATABASE_URL is not provided (e.g., in unit tests or lightweight dev),
    // fall back to an in-memory SQLite database so Prisma can instantiate.
    const databaseUrl =
        process.env.DATABASE_URL ||
        (process.env.NODE_ENV === 'test' ? 'file:./.test-db.sqlite' : undefined);

    const clientConfig: any = {
        log,
    };

    // Prisma Accelerate requires a prisma:// or prisma+postgres:// URL; only set it when provided.
    const isAccelerateUrl = (url?: string): boolean =>
        !!url && (url.startsWith('prisma://') || url.startsWith('prisma+postgres://'));

    if (isAccelerateUrl(databaseUrl)) {
        clientConfig.accelerateUrl = databaseUrl;
    }

    const client = new PrismaClient(clientConfig).$extends(withAccelerate());

    return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export type PrismaClientAccelerate = typeof prisma;
