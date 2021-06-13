import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import MeaningRepository from '@/vocabulary/repositories/MeaningRepository';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class VocabularyService {
    constructor(
        private readonly vocabularyRepository: VocabularyRepository,
        private readonly meaningRepository: MeaningRepository,
    ) {}
}
