import VocabularyService from '@/vocabulary/services/VocabularyService';
import { Body, Controller, Post } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

@Controller('/v1/vocabularies')
export default class VocabularyController {
    constructor(private readonly vocabularyService: VocabularyService) {}

    @Post()
    async createVocabulary(@Body() vocabulary: Vocabulary): Promise<Vocabulary> {
        return this.vocabularyService.createVocabulary(vocabulary);
    }
}
