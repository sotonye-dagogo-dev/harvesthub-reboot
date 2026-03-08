import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clean existing data
    await prisma.$transaction([
        prisma.notification.deleteMany(),
        prisma.transaction.deleteMany(),
        prisma.wallet.deleteMany(),
        prisma.review.deleteMany(),
        prisma.orderItem.deleteMany(),
        prisma.order.deleteMany(),
        prisma.cartItem.deleteMany(),
        prisma.cart.deleteMany(),
        prisma.product.deleteMany(),
        prisma.address.deleteMany(),
        prisma.vendor.deleteMany(),
        prisma.buyer.deleteMany(),
        prisma.banner.deleteMany(),
        prisma.user.deleteMany(),
    ]);

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // ========== ADMIN ==========
    const admin = await prisma.user.create({
        data: {
            email: 'admin@harvesthub.com',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'HarvestHub',
            phoneNumber: '+2348000000000',
            role: 'ADMIN',
            emailVerified: true,
            isActive: true,
            status: 'ACTIVE',
        },
    });

    // ========== VENDORS ==========
    const vendorUsers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'demo@harvesthub.com',
                password: hashedPassword,
                firstName: 'Demo',
                lastName: 'Vendor',
                phoneNumber: '+2348011111111',
                role: 'VENDOR',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
        prisma.user.create({
            data: {
                email: 'chioma@harvesthub.com',
                password: hashedPassword,
                firstName: 'Chioma',
                lastName: 'Okafor',
                phoneNumber: '+2348023456789',
                role: 'VENDOR',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
        prisma.user.create({
            data: {
                email: 'tunde@harvesthub.com',
                password: hashedPassword,
                firstName: 'Tunde',
                lastName: 'Adeyemi',
                phoneNumber: '+2348034567890',
                role: 'VENDOR',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
        prisma.user.create({
            data: {
                email: 'ngozi@harvesthub.com',
                password: hashedPassword,
                firstName: 'Ngozi',
                lastName: 'Eze',
                phoneNumber: '+2348045678901',
                role: 'VENDOR',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
        prisma.user.create({
            data: {
                email: 'emeka@harvesthub.com',
                password: hashedPassword,
                firstName: 'Emeka',
                lastName: 'Nwosu',
                phoneNumber: '+2348056789012',
                role: 'VENDOR',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
        prisma.user.create({
            data: {
                email: 'blessing@harvesthub.com',
                password: hashedPassword,
                firstName: 'Blessing',
                lastName: 'Adebayo',
                phoneNumber: '+2348067890123',
                role: 'VENDOR',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
    ]);

    const vendors = await Promise.all([
        prisma.vendor.create({
            data: {
                userId: vendorUsers[0].id,
                storeName: 'Demo Store',
                storeDescription: 'This is a demo vendor account for testing purposes.',
                category: 'OTHERS',
                whatsappNumber: '+2348011111111',
                campus: 'GBAGADA',
                position: 'TEAM_LEAD',
                status: 'APPROVED',
                isChurchAffiliated: true,
                commissionRate: 0.05,
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: true,
                    pickupServices: ['SUNDAY_FIRST', 'SUNDAY_SECOND', 'MIDWEEK'],
                    deliveryZones: [1, 2, 3, 4],
                    businessHours: 'Mon-Sat: 9AM-6PM',
                },
            },
        }),
        prisma.vendor.create({
            data: {
                userId: vendorUsers[1].id,
                storeName: "Chioma's Fresh Farms",
                storeDescription: 'Premium farm produce delivered fresh from our farms.',
                category: 'FARM_PRODUCE',
                whatsappNumber: '+2348023456789',
                campus: 'LEKKI',
                position: 'HOD',
                status: 'APPROVED',
                isChurchAffiliated: true,
                commissionRate: 0.05,
                totalSales: 435000,
                totalOrders: 234,
                totalProducts: 15,
                averageRating: 4.8,
                totalReviews: 127,
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: true,
                    pickupServices: ['SUNDAY_FIRST', 'MIDWEEK'],
                    deliveryZones: [1, 2, 3],
                    businessHours: 'Mon-Sat: 8AM-6PM',
                },
            },
        }),
        prisma.vendor.create({
            data: {
                userId: vendorUsers[2].id,
                storeName: "Tunde's Fashion Hub",
                storeDescription: 'Trendy and affordable fashion for men and women.',
                category: 'FASHION',
                whatsappNumber: '+2348034567890',
                campus: 'IKEJA',
                position: 'SMALL_GROUP_LEADER',
                status: 'APPROVED',
                isChurchAffiliated: true,
                commissionRate: 0.05,
                totalSales: 298000,
                totalOrders: 156,
                totalProducts: 28,
                averageRating: 4.6,
                totalReviews: 89,
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: true,
                    pickupServices: ['SUNDAY_SECOND', 'SPECIAL_EVENT'],
                    deliveryZones: [1, 2],
                    businessHours: 'Mon-Sat: 10AM-7PM',
                },
            },
        }),
        prisma.vendor.create({
            data: {
                userId: vendorUsers[3].id,
                storeName: "Ngozi's Beauty Essentials",
                storeDescription: 'Authentic beauty products, skincare, and cosmetics.',
                category: 'BEAUTY',
                whatsappNumber: '+2348045678901',
                campus: 'IKOYI',
                position: null,
                status: 'APPROVED',
                isChurchAffiliated: false,
                commissionRate: 0.05,
                totalSales: 612000,
                totalOrders: 345,
                totalProducts: 42,
                averageRating: 4.9,
                totalReviews: 203,
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: true,
                    pickupServices: ['SUNDAY_FIRST', 'SUNDAY_SECOND'],
                    deliveryZones: [1, 2, 3, 4],
                },
            },
        }),
        prisma.vendor.create({
            data: {
                userId: vendorUsers[4].id,
                storeName: "Emeka's Tech Store",
                storeDescription: 'Latest electronics and gadgets at competitive prices.',
                category: 'ELECTRONICS',
                whatsappNumber: '+2348056789012',
                campus: 'GBAGADA',
                position: 'ASST_HOD',
                status: 'APPROVED',
                isChurchAffiliated: true,
                commissionRate: 0.05,
                totalSales: 476000,
                totalOrders: 187,
                totalProducts: 35,
                averageRating: 4.7,
                totalReviews: 156,
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: true,
                    pickupServices: ['SUNDAY_FIRST', 'MIDWEEK'],
                    deliveryZones: [1, 2, 3],
                },
            },
        }),
        prisma.vendor.create({
            data: {
                userId: vendorUsers[5].id,
                storeName: "Blessing's Kitchen Supplies",
                storeDescription: 'Quality kitchen utensils, cookware, and home essentials.',
                category: 'HOME_KITCHEN',
                whatsappNumber: '+2348067890123',
                campus: 'ISOLO',
                position: 'ZONAL_COORDINATOR',
                status: 'APPROVED',
                isChurchAffiliated: true,
                commissionRate: 0.05,
                storeSettings: {
                    allowsPickup: true,
                    allowsDelivery: false,
                    pickupServices: ['SUNDAY_FIRST', 'SUNDAY_SECOND', 'MIDWEEK'],
                    deliveryZones: [],
                },
            },
        }),
    ]);

    // ========== BUYERS ==========
    const buyerUsers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'demo-buyer@harvesthub.com',
                password: hashedPassword,
                firstName: 'Demo',
                lastName: 'Buyer',
                phoneNumber: '+2348012345678',
                role: 'BUYER',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
        prisma.user.create({
            data: {
                email: 'adunni@email.com',
                password: hashedPassword,
                firstName: 'Adunni',
                lastName: 'Balogun',
                phoneNumber: '+2348098765432',
                role: 'BUYER',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
        prisma.user.create({
            data: {
                email: 'kemi@email.com',
                password: hashedPassword,
                firstName: 'Kemi',
                lastName: 'Johnson',
                phoneNumber: '+2348087654321',
                role: 'BUYER',
                emailVerified: true,
                isActive: true,
                status: 'ACTIVE',
            },
        }),
    ]);

    const buyers = await Promise.all(
        buyerUsers.map((user) =>
            prisma.buyer.create({
                data: {
                    userId: user.id,
                    preferences: {
                        notifications: { email: true, sms: true, push: true },
                        defaultCampus: 'GBAGADA',
                        defaultDeliveryMethod: 'PICKUP',
                    },
                },
            })
        )
    );

    // ========== WALLETS ==========
    await Promise.all([
        prisma.wallet.create({ data: { userId: admin.id, balance: 0, currency: 'NGN' } }),
        ...vendorUsers.map((u, i) =>
            prisma.wallet.create({
                data: { userId: u.id, balance: [0, 45000, 28000, 62000, 47000, 15000][i], currency: 'NGN' },
            })
        ),
        ...buyerUsers.map((u, i) =>
            prisma.wallet.create({
                data: { userId: u.id, balance: [50000, 25000, 15000][i], currency: 'NGN' },
            })
        ),
    ]);

    // ========== PRODUCTS (sample) ==========
    const products = await Promise.all([
        prisma.product.create({
            data: {
                vendorId: vendors[1].id,
                name: 'Fresh Organic Tomatoes',
                description: 'Locally grown organic tomatoes. Freshly harvested from our farm.',
                category: 'VEGETABLES',
                price: 2500,
                stock: 100,
                images: ['https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=500'],
                mainImage: 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=500',
                isActive: true,
                isFeatured: true,
                views: 245,
                sales: 89,
                averageRating: 4.8,
                totalReviews: 42,
            },
        }),
        prisma.product.create({
            data: {
                vendorId: vendors[1].id,
                name: 'Farm Fresh Eggs (Crate)',
                description: 'Free-range eggs from healthy chickens. One full crate of 30 eggs.',
                category: 'DAIRY',
                price: 4500,
                stock: 50,
                images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500'],
                mainImage: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500',
                isActive: true,
                isFeatured: false,
                views: 180,
                sales: 67,
                averageRating: 4.9,
                totalReviews: 38,
            },
        }),
        prisma.product.create({
            data: {
                vendorId: vendors[2].id,
                name: 'Ankara Print Dress',
                description: 'Beautiful Ankara print dress with modern cut. Available in multiple sizes.',
                category: 'CLOTHING',
                price: 15000,
                compareAtPrice: 18000,
                discount: 17,
                stock: 25,
                images: ['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=500'],
                mainImage: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=500',
                isActive: true,
                isFeatured: true,
                views: 320,
                sales: 45,
                averageRating: 4.6,
                totalReviews: 28,
                tags: ['ankara', 'dress', 'fashion', 'women'],
            },
        }),
        prisma.product.create({
            data: {
                vendorId: vendors[3].id,
                name: 'Premium Shea Butter',
                description: 'Pure, unrefined shea butter. Great for skin and hair care.',
                category: 'SKINCARE',
                price: 3500,
                stock: 200,
                images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500'],
                mainImage: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500',
                isActive: true,
                isFeatured: true,
                views: 410,
                sales: 156,
                averageRating: 4.9,
                totalReviews: 89,
            },
        }),
        prisma.product.create({
            data: {
                vendorId: vendors[4].id,
                name: 'Wireless Bluetooth Earbuds',
                description: 'High-quality wireless earbuds with noise cancellation.',
                category: 'AUDIO',
                price: 12000,
                compareAtPrice: 15000,
                discount: 20,
                stock: 40,
                images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500'],
                mainImage: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500',
                isActive: true,
                isFeatured: false,
                views: 280,
                sales: 78,
                averageRating: 4.7,
                totalReviews: 52,
                tags: ['earbuds', 'bluetooth', 'wireless', 'audio'],
            },
        }),
        prisma.product.create({
            data: {
                vendorId: vendors[5].id,
                name: 'Non-Stick Cooking Pot Set',
                description: 'Set of 3 non-stick cooking pots. Durable and easy to clean.',
                category: 'KITCHEN',
                price: 18000,
                stock: 30,
                images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
                mainImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
                isActive: true,
                isFeatured: true,
                views: 195,
                sales: 34,
                averageRating: 4.5,
                totalReviews: 21,
            },
        }),
    ]);

    // ========== ADDRESSES ==========
    await Promise.all(
        buyerUsers.map((user, i) => {
            const addresses = ['15 Admiralty Way', '8 Bode Thomas Street', '42 Allen Avenue'] as const;
            const campuses = ['LEKKI', 'IKOYI', 'IKEJA'] as const;
            return prisma.address.create({
                data: {
                    userId: user.id,
                    label: 'Home',
                    fullName: `${user.firstName} ${user.lastName}`,
                    phoneNumber: user.phoneNumber,
                    addressLine1: addresses[i % addresses.length]!,
                    city: 'Lagos',
                    state: 'Lagos',
                    campus: campuses[i % campuses.length]!,
                    isDefault: true,
                },
            });
        })
    );

    // ========== BANNERS ==========
    await prisma.banner.createMany({
        data: [
            {
                title: 'Welcome to HarvestHub!',
                subtitle: 'Your trusted church community marketplace',
                description: 'Shop from verified vendors in your church community.',
                imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
                position: 'HERO',
                theme: 'BUSINESS',
                isActive: true,
                displayOrder: 1,
                clickCount: 0,
                impressionCount: 0,
                createdBy: admin.id,
            },
            {
                title: 'Fresh Farm Produce',
                subtitle: 'Directly from local farms to your table',
                imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&h=400&fit=crop',
                position: 'HERO',
                theme: 'PROMOTION',
                isActive: true,
                displayOrder: 2,
                clickCount: 0,
                impressionCount: 0,
                createdBy: admin.id,
            },
        ],
    });

    console.log('✅ Seed completed');
    console.log(`   👤 Admin: admin@harvesthub.com`);
    console.log(`   🏪 Vendors: ${vendors.length}`);
    console.log(`   🛒 Buyers: ${buyers.length}`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   🔑 All passwords: Password123!`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
