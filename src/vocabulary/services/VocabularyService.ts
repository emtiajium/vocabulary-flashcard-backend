import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import { Injectable } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import * as _ from 'lodash';

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
        await this.definitionRepository.removeDefinitionsByIds(_.map(vocabularyInstance.definitions, 'id'));
        await this.vocabularyRepository.removeVocabularyById(vocabularyInstance.id);
        return this.vocabularyRepository.save(vocabularyInstance);
    }
}
