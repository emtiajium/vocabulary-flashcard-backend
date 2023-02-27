import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import { getRepository } from 'typeorm';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';

export function getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
    return getRepository(LeitnerSystems).findOne({ user: { id: userId }, vocabulary: { id: vocabularyId } });
}

export async function removeLeitnerBoxItems(userId: string): Promise<void> {
    await getRepository(LeitnerSystems).delete({ user: { id: userId } });
}

export async function removeLeitnerBoxItemsByCohortId(cohortId: string): Promise<void> {
    await getRepository(LeitnerSystems).query(
        `
            DELETE
            FROM "LeitnerSystems"
            WHERE "userId" IN (SELECT id
                               FROM "User"
                               WHERE "User"."cohortId" = $1);
        `,
        [cohortId],
    );
}

export function createItem(userId: string, vocabularyId: string, box: LeitnerBoxType): Promise<LeitnerSystems> {
    return getRepository(LeitnerSystems).save(LeitnerSystems.create(box, userId, vocabularyId, true));
}

export async function updateItem(id: string, leitnerSystems: Partial<LeitnerSystems>): Promise<void> {
    await getRepository(LeitnerSystems).update(id, leitnerSystems);
}
