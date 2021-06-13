import { getRepository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Meaning from '@/vocabulary/domains/Meaning';

export async function removeVocabularyAndRelationsByCohortId(cohortId: string): Promise<void> {
    await getRepository(Meaning).query(
        `DELETE
         FROM "Meaning"
         WHERE "vocabularyId" IN (
             SELECT id
             FROM "Vocabulary"
             WHERE "cohortId" = '${cohortId}'
         );`,
    );
    await getRepository(Vocabulary).delete({ cohortId });
}
