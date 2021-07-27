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

export async function getSingleVocabularyByCohortId(cohortId: string): Promise<Vocabulary> {
    return (
        await getRepository(Vocabulary).query(
            `SELECT *
             FROM "Vocabulary"
             WHERE "cohortId" = $1;`,
            [cohortId],
        )
    )[0];
}

export async function createVocabulary(vocabulary: Vocabulary, cohortId: string): Promise<Vocabulary> {
    return getRepository(Vocabulary).save({ ...vocabulary, cohortId });
}
