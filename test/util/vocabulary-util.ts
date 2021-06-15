import { getRepository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';

export async function removeVocabularyAndRelationsByCohortId(cohortId: string): Promise<void> {
    await getRepository(Definition).query(
        `DELETE
         FROM "Definition"
         WHERE "vocabularyId" IN (
             SELECT id
             FROM "Vocabulary"
             WHERE "cohortId" = '${cohortId}'
         );`,
    );
    await getRepository(Vocabulary).delete({ cohortId });
}

export async function getDefinitionByVocabularyId(vocabularyId: string): Promise<Definition[]> {
    return getRepository(Definition).query(
        `SELECT *
         FROM "Definition"
         WHERE "vocabularyId" = '${vocabularyId}';`,
    );
}
