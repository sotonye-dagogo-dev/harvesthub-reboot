import 'dotenv/config';
import { prisma } from '../lib/db/prisma';
import { repairPendingWalletTransactions } from '../lib/maintenance/pendingWalletTransactions';

async function main() {
    const args = new Set(process.argv.slice(2));
    const dryRun = !args.has('--apply');

    const summary = await repairPendingWalletTransactions({
        client: prisma as any,
        dryRun,
        logger: console,
    });

    console.log(
        JSON.stringify(
            {
                ...summary,
                mode: dryRun ? 'dry-run' : 'apply',
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error('Failed to repair pending wallet transactions', error);
    process.exitCode = 1;
});