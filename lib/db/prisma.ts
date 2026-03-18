import { PrismaClient } from '../../prisma/generated/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function isAccelerateUrl(url?: string): boolean {
    return !!url && (url.startsWith('prisma://') || url.startsWith('prisma+postgres://'));
}

function getPrismaDatabaseUrl(): string | undefined {
    const envDatabaseUrl = process.env.DATABASE_URL;
    const envDirectUrl = process.env.DIRECT_URL;

    // Prefer the direct connection when DATABASE_URL points at Prisma Accelerate.
    if (isAccelerateUrl(envDatabaseUrl) && envDirectUrl) {
        return envDirectUrl;
    }

    // Prefer DATABASE_URL when provided and not using Prisma Accelerate.
    if (envDatabaseUrl && !isAccelerateUrl(envDatabaseUrl)) {
        return envDatabaseUrl;
    }

    // Fall back to DIRECT_URL if present.
    if (envDirectUrl) {
        return envDirectUrl;
    }

    // In tests, use a lightweight sqlite file to keep the surface area small.
    if (process.env.NODE_ENV === 'test') {
        return 'file:./.test-db.sqlite';
    }

    // For local development, default to a sqlite file so developers can run without a Postgres instance.
    if (process.env.NODE_ENV === 'development') {
        return 'file:./.dev.db.sqlite';
    }

    return undefined;
}

function createPrismaClient() {
    const log = process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

    const databaseUrl = getPrismaDatabaseUrl();

    const clientConfig: any = {
        log,
    };

    // If using Prisma Accelerate, instruct the client accordingly.
    if (isAccelerateUrl(databaseUrl)) {
        clientConfig.accelerateUrl = databaseUrl;
    }

    // If using a direct connection, bind it explicitly (avoids relying on env vars in some runtimes).
    if (databaseUrl && !isAccelerateUrl(databaseUrl)) {
        clientConfig.datasources = {
            db: {
                url: databaseUrl,
            },
        };
    }

    const client = new PrismaClient(clientConfig).$extends(withAccelerate());

    return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export type PrismaClientAccelerate = typeof prisma;
