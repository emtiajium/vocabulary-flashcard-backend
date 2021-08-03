import VocabularyService from '@/vocabulary/services/VocabularyService';
import { Body, Controller, HttpCode, Post, HttpStatus, Get, Param, Delete, UseGuards } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import User from '@/user/domains/User';

@Controller('/v1/vocabularies')
export default class VocabularyController {
    constructor(private readonly vocabularyService: VocabularyService) {}

    @Post()
    @UseGuards(AuthGuard)
    async createVocabulary(@Body() vocabulary: Vocabulary, @AuthenticatedUser() user: User): Promise<Vocabulary> {
        return this.vocabularyService.createVocabulary(vocabulary, user.cohortId);
    }

    @Post('/search')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async findVocabularies(
        @AuthenticatedUser() user: User,
        @Body() vocabularySearch: VocabularySearch,
    ): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyService.findVocabularies(user.id, user.cohortId, vocabularySearch);
    }

    @Get('/:id')
    @UseGuards(AuthGuard)
    async findVocabularyById(@Param('id') id: string): Promise<Vocabulary> {
        return this.vocabularyService.findVocabularyById(id);
    }

    @Delete('/:id')
    @UseGuards(AuthGuard)
    async removeVocabularyById(@Param('id') id: string): Promise<void> {
        await this.vocabularyService.removeVocabularyById(id);
    }

    @Post('/bootstrap')
    @UseGuards(AuthGuard)
    async createInitialVocabularies(@AuthenticatedUser() user: User): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyService.createInitialVocabularies(user.cohortId);
    }
}
