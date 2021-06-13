import VocabularyService from '@/vocabulary/services/VocabularyService';
import { Controller } from '@nestjs/common';

@Controller('/v1/vocabularies')
export default class VocabularyController {
    constructor(private readonly vocabularyService: VocabularyService) {}
}
