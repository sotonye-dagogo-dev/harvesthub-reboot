import prismaAdapter from './prismaAdapter';

function missingAdapter(name: string) {
    const handler: ProxyHandler<Record<string, unknown>> = {
        get() {
            return () => {
                throw new Error(
                    `Prisma adapter for '${name}' is not implemented.\n` +
                    `Add the adapter in lib/data/prismaAdapter.ts to enable this domain.`
                );
            };
        },
    };

    return new Proxy({}, handler) as any;
}

// Warn if any expected adapters are missing in Prisma-first mode.
{
    const available = Object.keys(prismaAdapter || {});
    const expected = [
        'userDb',
        'buyerDb',
        'vendorDb',
        'productDb',
        'cartDb',
        'orderDb',
        'walletDb',
        'transactionDb',
        'reviewDb',
        'bannerDb',
        'adApplicationDb',
        'adRateConfigDb',
        'addressDb',
    ];

    const missing = expected.filter((key) => !available.includes(key));
    if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`Prisma adapters missing: ${missing.join(', ')}`);
    }
}

export const userDb = prismaAdapter.userDb ?? missingAdapter('userDb');
export const buyerDb = prismaAdapter.buyerDb ?? missingAdapter('buyerDb');
export const vendorDb = prismaAdapter.vendorDb ?? missingAdapter('vendorDb');
export const productDb = prismaAdapter.productDb ?? missingAdapter('productDb');
export const cartDb = prismaAdapter.cartDb ?? missingAdapter('cartDb');
export const orderDb = prismaAdapter.orderDb ?? missingAdapter('orderDb');
export const walletDb = prismaAdapter.walletDb ?? missingAdapter('walletDb');
export const transactionDb = prismaAdapter.transactionDb ?? missingAdapter('transactionDb');
export const reviewDb = prismaAdapter.reviewDb ?? missingAdapter('reviewDb');
export const bannerDb = prismaAdapter.bannerDb ?? missingAdapter('bannerDb');
export const adApplicationDb = prismaAdapter.adApplicationDb ?? missingAdapter('adApplicationDb');
export const adRateConfigDb = prismaAdapter.adRateConfigDb ?? missingAdapter('adRateConfigDb');
export const addressDb = prismaAdapter.addressDb ?? missingAdapter('addressDb');

export const dbStats = {
    mode: 'prisma' as const,
    getSummary: () => ({
        mode: 'prisma' as const,
        adaptersLoaded: Object.keys(prismaAdapter || {}).length,
    }),
};

export const db = {
    users: userDb,
    buyers: buyerDb,
    vendors: vendorDb,
    products: productDb,
    carts: cartDb,
    orders: orderDb,
    wallets: walletDb,
    transactions: transactionDb,
    reviews: reviewDb,
    banners: bannerDb,
    adApplications: adApplicationDb,
    adRateConfig: adRateConfigDb,
    addresses: addressDb,
    stats: dbStats,
};
