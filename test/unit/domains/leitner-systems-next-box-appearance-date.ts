import { differenceInCalendarDays } from 'date-fns';
import LeitnerBoxAppearanceDifference from '@/vocabulary/domains/LeitnerBoxAppearanceDifference';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

function getDayOffsetFor(box: LeitnerBoxType): number {
    return differenceInCalendarDays(LeitnerSystems.calculateNextBoxAppearanceDate(box), new Date());
}

describe('LeitnerSystems.calculateNextBoxAppearanceDate', () => {
    it('SHOULD schedule each box exactly the configured number of calendar days ahead of today', () => {
        expect(getDayOffsetFor(LeitnerBoxType.BOX_1)).toBe(LeitnerBoxAppearanceDifference.BOX_1);
        expect(getDayOffsetFor(LeitnerBoxType.BOX_2)).toBe(LeitnerBoxAppearanceDifference.BOX_2);
        expect(getDayOffsetFor(LeitnerBoxType.BOX_3)).toBe(LeitnerBoxAppearanceDifference.BOX_3);
        expect(getDayOffsetFor(LeitnerBoxType.BOX_4)).toBe(LeitnerBoxAppearanceDifference.BOX_4);
        expect(getDayOffsetFor(LeitnerBoxType.BOX_5)).toBe(LeitnerBoxAppearanceDifference.BOX_5);
    });
});
