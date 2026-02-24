import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatDate,
    formatPhoneNumber,
    generateId,
} from '@/lib/utils';

describe('Utility Functions', () => {
    describe('formatCurrency', () => {
        it('should format Nigerian Naira correctly', () => {
            expect(formatCurrency(1000)).toBe('₦1,000.00');
            expect(formatCurrency(1234.56)).toBe('₦1,234.56');
            expect(formatCurrency(0)).toBe('₦0.00');
        });

        it('should handle negative values', () => {
            expect(formatCurrency(-500)).toBe('-₦500.00');
        });

        it('should handle large numbers', () => {
            expect(formatCurrency(1000000)).toBe('₦1,000,000.00');
        });
    });

    describe('formatDate', () => {
        it('should format dates correctly', () => {
            const date = new Date('2025-01-30T12:00:00Z');
            const formatted = formatDate(date);
            expect(formatted).toBeTruthy();
            expect(typeof formatted).toBe('string');
        });
    });

    describe('formatPhoneNumber', () => {
        it('should format Nigerian phone numbers with +234 prefix', () => {
            expect(formatPhoneNumber('08012345678')).toContain('+234');
        });
    });

    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
        });

        it('should generate IDs of expected length', () => {
            const id = generateId();
            expect(id.length).toBeGreaterThan(0);
        });
    });
});
