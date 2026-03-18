import { prisma } from '../lib/db/prisma';

async function main() {
    try {
        console.log('Prisma client created');
        await prisma.$connect();
        console.log('Connected to database successfully');
    } catch (error) {
        console.error('Prisma connection error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
