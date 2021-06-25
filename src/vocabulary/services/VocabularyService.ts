import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import { Injectable } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import * as _ from 'lodash';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';

@Injectable()
export default class VocabularyService {
    constructor(
        private readonly vocabularyRepository: VocabularyRepository,
        private readonly definitionRepository: DefinitionRepository,
    ) {}

    async createVocabulary(vocabulary: Vocabulary): Promise<Vocabulary> {
        const vocabularyInstance = Vocabulary.populateMeanings(vocabulary);
        // this is a workaround
        // facing issues during "UPDATE"
        if (vocabulary.definitions.length > 0) {
            await this.definitionRepository.removeDefinitionsByIds(_.map(vocabularyInstance.definitions, 'id'));
        }
        await this.vocabularyRepository.removeVocabularyById(vocabularyInstance.id);
        return this.vocabularyRepository.save(vocabularyInstance);
    }

    async findVocabularies(vocabularySearch: VocabularySearch): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyRepository.findVocabularies(vocabularySearch);
    }

    async findVocabularyById(id: string): Promise<Vocabulary> {
        return this.vocabularyRepository.findVocabularyById(id);
    }
}
