import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Definition from '@/vocabulary/domains/Definition';

type VocabularySearchResponse = Pick<Vocabulary, 'id' | 'word' | 'isInLeitnerBox'> & {
    definitions: Pick<Definition, 'id' | 'meaning'>[];
};

export default VocabularySearchResponse;
