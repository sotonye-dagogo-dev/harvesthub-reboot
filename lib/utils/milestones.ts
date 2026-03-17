/**
 * Milestone Trigger Utilities
 *
 * Functions to check and award milestones to users.
 * Called from within order creation, registration, review submission, etc.
 */

import { milestoneDb } from '@/lib/data/milestones';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@/lib/constants';
import type { MilestoneType } from '@/lib/types';

/**
 * Check if a user already has a milestone of the given type.
 * If not, create the milestone for that user.
 */
export async function checkAndAwardMilestone(
    userId: string,
    type: MilestoneType,
    label: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    const existing = await milestoneDb.findByUserAndType(userId, type);
    if (existing) return;

    await milestoneDb.create({
        userId,
        milestoneType: type,
        label,
        metadata,
    });
}

/**
 * Returns the count of users with a specific role from the database.
 */
export async function getRegistrationCount(role: UserRole): Promise<number> {
    return prisma.user.count({ where: { role } });
}

/**
 * Check and award registration-based milestones.
 * Call after a new user registers.
 */
export async function checkRegistrationMilestones(userId: string, role: string): Promise<void> {
    if (role === UserRole.VENDOR) {
        const vendorCount = await getRegistrationCount(UserRole.VENDOR);
        if (vendorCount <= 1000) {
            await checkAndAwardMilestone(userId, 'FIRST_1000_VENDORS', 'Early Vendor Pioneer', {
                vendorNumber: vendorCount,
            });
        }
    }

    if (role === UserRole.BUYER) {
        const buyerCount = await getRegistrationCount(UserRole.BUYER);
        if (buyerCount <= 1000) {
            await checkAndAwardMilestone(userId, 'FIRST_1000_BUYERS', 'Early Buyer Pioneer', {
                buyerNumber: buyerCount,
            });
        }
    }
}

/**
 * Award FIRST_PURCHASE milestone after a buyer completes their first order.
 */
export function checkFirstPurchaseMilestone(userId: string): void {
    checkAndAwardMilestone(userId, 'FIRST_PURCHASE', 'First Purchase Completed', {
        achievedAt: new Date().toISOString(),
    });
}

/**
 * Award FIRST_SALE milestone after a vendor's first completed sale.
 */
export function checkFirstSaleMilestone(vendorUserId: string): void {
    checkAndAwardMilestone(vendorUserId, 'FIRST_SALE', 'First Sale Completed', {
        achievedAt: new Date().toISOString(),
    });
}

/**
 * Award FIRST_REVIEW milestone after a buyer writes their first review.
 */
export function checkFirstReviewMilestone(userId: string): void {
    checkAndAwardMilestone(userId, 'FIRST_REVIEW', 'First Review Written', {
        achievedAt: new Date().toISOString(),
    });
}

/**
 * Check if a vendor has reached 100 sales and award the milestone.
 */
export function checkVendor100SalesMilestone(
    vendorUserId: string,
    totalSales: number
): void {
    if (totalSales >= 100) {
        checkAndAwardMilestone(vendorUserId, 'VENDOR_100_SALES', 'Century Sales Club', {
            totalSales,
        });
    }
}
