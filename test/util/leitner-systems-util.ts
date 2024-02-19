import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import DataSource from '@/common/persistence/TypeormConfig';

export function getLeitnerBoxItem(userId: string, vocabularyId: string): Promise<LeitnerSystems> {
    return DataSource.getRepository(LeitnerSystems).findOneBy({
        user: { id: userId },
        vocabulary: { id: vocabularyId },
    });
}

export async function removeLeitnerBoxItems(userId: string): Promise<void> {
    await DataSource.getRepository(LeitnerSystems).delete({ user: { id: userId } });
}

export async function removeLeitnerBoxItemsByCohortId(cohortId: string): Promise<void> {
    await DataSource.getRepository(LeitnerSystems).query(
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
    return DataSource.getRepository(LeitnerSystems).save(LeitnerSystems.create(box, userId, vocabularyId, true));
}

export async function updateItem(id: string, leitnerSystems: Partial<LeitnerSystems>): Promise<void> {
    await DataSource.getRepository(LeitnerSystems).update(id, leitnerSystems);
}
