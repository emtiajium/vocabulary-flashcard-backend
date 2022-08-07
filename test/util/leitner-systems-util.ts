import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import { getRepository } from 'typeorm';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';

export function getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
    return getRepository(LeitnerSystems).findOne({ userId, vocabularyId });
}

export async function removeLeitnerBoxItems(userId: string): Promise<void> {
    await getRepository(LeitnerSystems).delete({ userId });
}

export function createItem(userId: string, vocabularyId: string, box: LeitnerBoxType): Promise<LeitnerSystems> {
    return getRepository(LeitnerSystems).save(LeitnerSystems.create(box, userId, vocabularyId, true));
}
