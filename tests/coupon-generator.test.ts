
import { describe, it, expect, vi } from 'vitest';
import type { Coupon, Therapist } from '../src/lib/types';

// Mock version of the server action to test idempotency
async function generateMissingTherapistCodes_mock(
    allTherapists: Therapist[],
    existingCoupons: Coupon[]
): Promise<Coupon[]> {
    const therapistsWithCodes = new Set(existingCoupons.map(c => c.therapistId));
    const therapistsMissingCodes = allTherapists.filter(t => !therapistsWithCodes.has(t.id));
    if (therapistsMissingCodes.length === 0) {
        return [];
    }
    const newCoupons: Coupon[] = therapistsMissingCodes.map(therapist => {
        const newCode = `DR${therapist.name.split(' ').pop()?.toUpperCase()}${Math.floor(Math.random() * 90) + 10}`;
        return {
            id: `coupon-${therapist.id}`,
            code: newCode,
            therapistId: therapist.id,
            discountType: 'percent',
            value: 0.05,
            permanent: true,
            active: true,
        };
    });
    return newCoupons;
}

describe('Service: generateMissingTherapistCodes', () => {
    const mockTherapists: Therapist[] = [
        { id: 't1', name: 'Dr. Anna Smith' } as Therapist,
        { id: 't2', name: 'Dr. Ben Carter' } as Therapist,
    ];

    it('should be idempotent and not generate coupons for therapists who already have them', async () => {
        const mockExistingCoupons: Coupon[] = [
            { id: 'c1', therapistId: 't1', code: 'DRSMITH10' } as Coupon,
        ];

        // First run: should generate a coupon for Dr. Carter (t2)
        const firstRunResult = await generateMissingTherapistCodes_mock(mockTherapists, mockExistingCoupons);
        expect(firstRunResult).toHaveLength(1);
        expect(firstRunResult[0].therapistId).toBe('t2');

        // Second run: simulate that the new coupon has been added to the database
        const updatedCoupons = [...mockExistingCoupons, ...firstRunResult];
        const secondRunResult = await generateMissingTherapistCodes_mock(mockTherapists, updatedCoupons);
        expect(secondRunResult).toHaveLength(0);
    });
});
