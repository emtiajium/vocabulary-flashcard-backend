import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import { v4 as uuidV4 } from 'uuid';
import { plainToInstance } from 'class-transformer';
import { cloneDeep, map } from 'lodash';

type PartialDefinition = Required<Pick<Definition, 'meaning' | 'examples' | 'notes' | 'externalLinks'>>;
type VocabularyWithoutDefinitions = Required<
    Pick<Vocabulary, 'word' | 'linkerWords' | 'genericNotes' | 'genericExternalLinks'>
>;
type PartialVocabulary = Required<VocabularyWithoutDefinitions & { definitions: PartialDefinition[] }>;

export default PartialVocabulary;

export function createVocabularies(cohortId: string, vocabularies: PartialVocabulary[]): Vocabulary[] {
    return map(cloneDeep(vocabularies), (vocabulary) => {
        const vocabularyId = uuidV4();
        // plainToInstance() to make @Transform() works
        return plainToInstance(Vocabulary, {
            ...vocabulary,
            id: vocabularyId,
            cohortId,
            definitions: map(vocabulary.definitions, (definition) => {
                return {
                    ...definition,
                    id: uuidV4(),
                    vocabularyId,
                } as Definition;
            }),
            isDraft: false,
        });
    });
}
