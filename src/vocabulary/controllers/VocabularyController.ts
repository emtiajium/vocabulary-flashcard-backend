import VocabularyService from '@/vocabulary/services/VocabularyService';
import { Body, Controller, HttpCode, Post, HttpStatus, Get, Param, Delete } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';

@Controller('/v1/vocabularies')
export default class VocabularyController {
    constructor(private readonly vocabularyService: VocabularyService) {}

    @Post()
    async createVocabulary(@Body() vocabulary: Vocabulary): Promise<Vocabulary> {
        return this.vocabularyService.createVocabulary(vocabulary);
    }

    @Post('/search')
    @HttpCode(HttpStatus.OK)
    async findVocabularies(@Body() vocabularySearch: VocabularySearch): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyService.findVocabularies(vocabularySearch);
    }

    @Get('/:id')
    async findVocabularyById(@Param('id') id: string): Promise<Vocabulary> {
        return this.vocabularyService.findVocabularyById(id);
    }

    @Delete('/:id')
    async removeVocabularyById(@Param('id') id: string): Promise<void> {
        await this.vocabularyService.removeVocabularyById(id);
    }
}
