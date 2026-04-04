import { PrismaClient } from '../../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
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
    // Note: the schema is configured for PostgreSQL, so this is only suitable if
    // you have a test database configured/available.
    if (process.env.NODE_ENV === 'test') {
        return process.env.DATABASE_URL;
    }

    // If no database URL is provided, do not attempt to connect.
    // The data layer will throw explicit configuration errors when used.
    return undefined;
}

function createPrismaClient(): PrismaClient {
    const log = process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'];

    const databaseUrl = getPrismaDatabaseUrl();

    const clientConfig: any = {
        log,
    };

    // If using Prisma Accelerate, instruct the client accordingly.
    if (isAccelerateUrl(databaseUrl)) {
        clientConfig.accelerateUrl = databaseUrl;
    }

    // If using a direct connection (Postgres), configure the Postgres adapter.
    // Prisma Client (engine type "client") requires an adapter or accelerateUrl.
    if (databaseUrl && !isAccelerateUrl(databaseUrl)) {
        clientConfig.adapter = new PrismaPg({ connectionString: databaseUrl });
    }

    if (!databaseUrl) {
        // Return a no-op proxy that provides helpful errors when data access is attempted.
        const warning =
            'Prisma is not configured: set DATABASE_URL (or DIRECT_URL) to a Postgres connection string. Runtime mock fallback is disabled.';
        console.warn(warning);

        const noop = async () => {
            throw new Error(warning);
        };

        const dummy = new Proxy(
            {
                $connect: async () => { },
                $disconnect: async () => { },
                $on: () => { },
            },
            {
                get(target, prop) {
                    if (prop in target) return (target as any)[prop];
                    return noop;
                },
            }
        );

        return dummy as unknown as ReturnType<typeof createPrismaClient>;
    }

    const client = new PrismaClient(clientConfig).$extends(withAccelerate());

    // The Prisma client extension can change the inferred type shape.
    // Cast back to the expected PrismaClient type for consistency.
    return client as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export type PrismaClientAccelerate = typeof prisma;
