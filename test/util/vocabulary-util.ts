import { getRepository } from 'typeorm';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { v4 as uuidV4 } from 'uuid';

export async function removeVocabularyAndRelationsByCohortId(cohortId: string): Promise<void> {
    await getRepository(Definition).query(
        `DELETE
         FROM "Definition"
         WHERE "vocabularyId" IN (
             SELECT id
             FROM "Vocabulary"
             WHERE "cohortId" = $1
         );`,
        [cohortId],
    );
    await getRepository(Vocabulary).delete({ cohortId });
}

export function getDefinitionsByVocabularyId(vocabularyId: string): Promise<Definition[]> {
    return getRepository(Definition).query(
        `SELECT *
         FROM "Definition"
         WHERE "vocabularyId" = $1
         ORDER BY "createdAt" ASC;`,
        [vocabularyId],
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

export function getVocabularyById(id: string): Promise<Vocabulary> {
    return getRepository(Vocabulary).findOne(id);
}

export function createVocabulary(vocabulary: Vocabulary, cohortId: string): Promise<Vocabulary> {
    return getRepository(Vocabulary).save({ ...vocabulary, cohortId });
}

export function getVocabularyWithDefinitions(): Vocabulary {
    const definition = new Definition();
    definition.id = uuidV4();
    definition.meaning = 'Meaning 1';
    definition.examples = ['Example 1'];
    definition.notes = ['Notes 1'];
    definition.externalLinks = ['https://gibberish.com/public/static/blah.html'];

    const vocabulary = new Vocabulary();
    vocabulary.id = uuidV4();
    vocabulary.isDraft = false;
    vocabulary.word = 'Word 1';
    definition.vocabularyId = vocabulary.id;
    vocabulary.definitions = [definition];

    return vocabulary;
}
