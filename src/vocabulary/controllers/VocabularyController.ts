import VocabularyService from '@/vocabulary/services/VocabularyService';
import { Body, Controller, HttpCode, Post, HttpStatus, Get, Param, Delete, UseGuards } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import VocabularySearch from '@/vocabulary/domains/VocabularySearch';
import SearchResult from '@/common/domains/SearchResult';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http/AuthenticatedUser';
import User from '@/user/domains/User';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('/v1/vocabularies')
@ApiSecurity('Authorization')
@UseGuards(AuthGuard)
export default class VocabularyController {
    constructor(private readonly vocabularyService: VocabularyService) {}

    @Post()
    createVocabulary(@Body() vocabulary: Vocabulary, @AuthenticatedUser() user: User): Promise<Vocabulary> {
        return this.vocabularyService.createVocabulary(vocabulary, user.id, user.cohortId);
    }

    @Post('/search')
    @HttpCode(HttpStatus.OK)
    findVocabularies(
        @AuthenticatedUser() user: User,
        @Body() vocabularySearch: VocabularySearch,
    ): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyService.findVocabularies(user.id, user.cohortId, vocabularySearch);
    }

    @Get('/:id')
    findVocabularyById(@Param('id') id: string, @AuthenticatedUser() user: User): Promise<Vocabulary> {
        return this.vocabularyService.findVocabularyById(id, user.id);
    }

    @Delete('/:id')
    async removeVocabularyById(@Param('id') id: string, @AuthenticatedUser() user: User): Promise<void> {
        await this.vocabularyService.removeVocabularyById(id, user);
    }

    @Post('/bootstrap')
    createInitialVocabularies(@AuthenticatedUser() user: User): Promise<SearchResult<Vocabulary>> {
        return this.vocabularyService.createInitialVocabularies(user.cohortId);
    }

    @Get('/:id/assert-existence/words/:word')
    assertExistenceByWord(
        @Param('id') id: string,
        @Param('word') word: string,
        @AuthenticatedUser() user: User,
    ): Promise<Partial<Vocabulary>> {
        return this.vocabularyService.assertExistenceByWord(id, word, user.cohortId);
    }
}
