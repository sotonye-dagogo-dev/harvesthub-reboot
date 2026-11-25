import { describe, expect, it } from 'vitest';
import {
    checkVerificationDocuments,
    checkVettingDetails,
    normalizeSellerType,
    requiredDocTypesFor,
} from '@/lib/services/vendorVerification';
import { isVendorBlocked, visibleVendorProductWhere } from '@/lib/services/vendorStatus';

const doc = (documentType: string) => ({
    documentType,
    url: `https://res.cloudinary.com/demo/image/upload/${documentType.toLowerCase()}.png`,
});

describe('vendor verification', () => {
    it('treats unknown seller types as BUSINESS (stricter rule)', () => {
        expect(normalizeSellerType(undefined)).toBe('BUSINESS');
        expect(normalizeSellerType('INDIVIDUAL')).toBe('INDIVIDUAL');
    });

    it('does not require CAC for individuals', () => {
        expect(requiredDocTypesFor('INDIVIDUAL')).toEqual(['ID', 'UTILITY_BILL']);
        const check = checkVerificationDocuments({
            sellerType: 'INDIVIDUAL',
            documents: [doc('ID'), doc('UTILITY_BILL')],
            idType: 'NIN',
        });
        expect(check.ok).toBe(true);
    });

    it('requires CAC for registered businesses', () => {
        const check = checkVerificationDocuments({
            sellerType: 'BUSINESS',
            documents: [doc('ID'), doc('UTILITY_BILL')],
            idType: 'NIN',
        });
        expect(check.ok).toBe(false);
    });

    it('requires department and a referee with a valid phone', () => {
        expect(checkVettingDetails({ department: 'Choir', refereeName: 'Bisi', refereePhone: '08011112222' }).ok).toBe(true);
        expect(checkVettingDetails({ department: ' ', refereeName: 'Bisi', refereePhone: '08011112222' }).ok).toBe(false);
        expect(checkVettingDetails({ department: 'Choir', refereeName: 'Bisi', refereePhone: 'call me' }).ok).toBe(false);
    });
});

describe('vendor status', () => {
    it('blocks suspended and rejected stores only', () => {
        expect(isVendorBlocked('SUSPENDED')).toBe(true);
        expect(isVendorBlocked('REJECTED')).toBe(true);
        expect(isVendorBlocked('PENDING')).toBe(false);
        expect(isVendorBlocked('APPROVED')).toBe(false);
    });

    it('filters public product queries by vendor status', () => {
        expect(visibleVendorProductWhere()).toEqual({
            vendor: { status: { notIn: ['SUSPENDED', 'REJECTED'] } },
        });
    });
});
