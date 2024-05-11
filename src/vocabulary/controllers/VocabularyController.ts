import VocabularyService from '@/vocabulary/services/VocabularyService';
import { Body, Controller, HttpCode, Post, HttpStatus, Get, Param, Delete, UseGuards } from '@nestjs/common';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import VocabularySearchRequest from '@/vocabulary/domains/VocabularySearchRequest';
import SearchResult from '@/common/domains/SearchResult';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http/AuthenticatedUser';
import User from '@/user/domains/User';
import { ApiSecurity } from '@nestjs/swagger';
import VocabularySearchResponse from '@/vocabulary/domains/VocabularySearchResponse';
import { RandomlyChosenMeaningResponse } from '@/vocabulary/domains/RandomlyChosenMeaningResponse';

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
        @Body() vocabularySearchRequest: VocabularySearchRequest,
    ): Promise<SearchResult<VocabularySearchResponse>> {
        return this.vocabularyService.findVocabularies(user.id, user.cohortId, vocabularySearchRequest);
    }

    @Get('/:id')
    findVocabularyById(@Param('id') id: string, @AuthenticatedUser() user: User): Promise<Vocabulary> {
        return this.vocabularyService.findVocabularyById(id, user.id);
    }

    @Get('/words/:word')
    findVocabularyByWord(@Param('word') word: string, @AuthenticatedUser() user: User): Promise<Vocabulary> {
        return this.vocabularyService.findVocabularyByWord(word, user.id, user.cohortId);
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
        @AuthenticatedUser('cohortId') cohortId: string,
    ): Promise<Partial<Vocabulary>> {
        return this.vocabularyService.assertExistenceByWord(id, word, cohortId);
    }

    @Get('/definitions/random-search')
    getRandomlyChosenMeanings(
        @AuthenticatedUser('cohortId') cohortId: string,
    ): Promise<RandomlyChosenMeaningResponse[]> {
        return this.vocabularyService.getRandomlyChosenMeanings(cohortId);
    }
}
