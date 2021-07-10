import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';
import * as _ from 'lodash';
import { v4 as uuidV4 } from 'uuid';

type PartialDefinition = Required<Pick<Definition, 'meaning' | 'examples' | 'notes' | 'externalLinks'>>;
type VocabularyWithoutDefinitions = Required<
    Pick<Vocabulary, 'word' | 'linkerWords' | 'genericNotes' | 'genericExternalLinks'>
>;
type PartialVocabulary = Required<VocabularyWithoutDefinitions & { definitions: PartialDefinition[] }>;

export default PartialVocabulary;

export function createVocabularies(cohortId: string, vocabularies: PartialVocabulary[]): Vocabulary[] {
    return _.map(_.cloneDeep(vocabularies), (vocabulary) => {
        const vocabularyId = uuidV4();
        return {
            ...vocabulary,
            id: vocabularyId,
            cohortId,
            definitions: _.map(vocabulary.definitions, (definition) => {
                return {
                    ...definition,
                    id: uuidV4(),
                    vocabularyId,
                } as Definition;
            }),
            isDraft: false,
        } as Vocabulary;
    });
}
