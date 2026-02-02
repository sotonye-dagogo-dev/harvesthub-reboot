import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatDate,
    formatPhone,
    generateId,
    calculateOrderTotal,
} from '@/app/_utils';

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
            expect(formatted).toContain('Jan');
            expect(formatted).toContain('30');
            expect(formatted).toContain('2025');
        });

        it('should handle invalid dates', () => {
            const result = formatDate(new Date('invalid'));
            expect(result).toBe('Invalid Date');
        });
    });

    describe('formatPhone', () => {
        it('should format Nigerian phone numbers with +234 prefix', () => {
            expect(formatPhone('08012345678')).toBe('+234 801 234 5678');
            expect(formatPhone('07012345678')).toBe('+234 701 234 5678');
        });

        it('should handle already formatted numbers', () => {
            expect(formatPhone('+2348012345678')).toBe('+234 801 234 5678');
        });

        it('should handle invalid phone numbers gracefully', () => {
            expect(formatPhone('123')).toBe('123');
            expect(formatPhone('')).toBe('');
        });
    });

    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
        });

        it('should generate IDs of expected format', () => {
            const id = generateId();
            expect(id).toMatch(/^[a-z0-9-]+$/);
            expect(id.length).toBeGreaterThan(10);
        });
    });

    describe('calculateOrderTotal', () => {
        it('should calculate total correctly', () => {
            const items = [
                { price: 1000, quantity: 2 },
                { price: 500, quantity: 3 },
            ];
            expect(calculateOrderTotal(items)).toBe(3500);
        });

        it('should handle empty cart', () => {
            expect(calculateOrderTotal([])).toBe(0);
        });

        it('should handle decimal prices', () => {
            const items = [
                { price: 10.5, quantity: 2 },
                { price: 5.25, quantity: 4 },
            ];
            expect(calculateOrderTotal(items)).toBe(42);
        });
    });
});
