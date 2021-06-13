import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import { Injectable } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

@Injectable()
export default class VocabularyService {
    constructor(private readonly vocabularyRepository: VocabularyRepository) {}

    async createVocabulary(vocabulary: Vocabulary): Promise<Vocabulary> {
        return this.vocabularyRepository.save(vocabulary);
    }
}
