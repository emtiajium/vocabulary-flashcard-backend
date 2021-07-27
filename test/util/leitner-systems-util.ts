import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import { getRepository } from 'typeorm';

export async function getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
    return getRepository(LeitnerSystems).findOne({ userId, vocabularyId });
}

export async function removeLeitnerBoxItems(userId: string): Promise<void> {
    await getRepository(LeitnerSystems).delete({ userId });
}
