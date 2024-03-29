import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { v4 as uuidV4 } from 'uuid';
import { removeLeitnerBoxItemsByCohortId } from '@test/util/leitner-systems-util';
import DataSource from '@/common/persistence/TypeormConfig';

export async function removeVocabularyAndRelationsByCohortId(cohortId: string): Promise<void> {
    await DataSource.getRepository(Definition).query(
        `DELETE
         FROM "Definition"
         WHERE "vocabularyId" IN (SELECT id
                                  FROM "Vocabulary"
                                  WHERE "cohortId" = $1);`,
        [cohortId],
    );
    await removeLeitnerBoxItemsByCohortId(cohortId);
    await DataSource.getRepository(Vocabulary).delete({ cohortId });
}

export function getDefinitionsByVocabularyId(vocabularyId: string): Promise<Definition[]> {
    return DataSource.getRepository(Definition).query(
        `SELECT *
         FROM "Definition"
         WHERE "vocabularyId" = $1
         ORDER BY "createdAt" ASC;`,
        [vocabularyId],
    );
}

export async function getSingleVocabularyByCohortId(cohortId: string): Promise<Vocabulary> {
    return (
        await DataSource.getRepository(Vocabulary).query(
            `SELECT *
             FROM "Vocabulary"
             WHERE "cohortId" = $1
             LIMIT 1;`,
            [cohortId],
        )
    )[0];
}

export function getVocabularyById(id: string): Promise<Vocabulary> {
    return DataSource.getRepository(Vocabulary).findOne({ where: { id }, relations: ['definitions'] });
}

export function createVocabulary(vocabulary: Vocabulary, cohortId: string): Promise<Vocabulary> {
    return DataSource.getRepository(Vocabulary).save({ ...vocabulary, cohortId });
}

export function getVocabularyWithDefinitions(): Vocabulary {
    const definition = new Definition();
    definition.id = uuidV4();
    definition.meaning = 'Meaning 1';
    definition.examples = ['Example 1'];
    definition.notes = ['Notes 1'];
    definition.externalLinks = ['https://firecrackervocabulary.com/privacy-policy'];

    const vocabulary = new Vocabulary();
    vocabulary.id = uuidV4();
    vocabulary.isDraft = false;
    vocabulary.word = `Word_${uuidV4()}`;
    definition.vocabularyId = vocabulary.id;
    vocabulary.definitions = [definition];

    return vocabulary;
}
