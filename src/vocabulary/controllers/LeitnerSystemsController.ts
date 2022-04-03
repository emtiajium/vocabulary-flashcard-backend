import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import User from '@/user/domains/User';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import Pagination from '@/common/domains/Pagination';
import SearchResult from '@/common/domains/SearchResult';
import LeitnerBoxItem from '@/vocabulary/domains/LeitnerBoxItem';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('/v1/leitner-systems')
@ApiSecurity('Authorization')
@UseGuards(AuthGuard)
export default class LeitnerSystemsController {
    constructor(private readonly leitnerSystemsService: LeitnerSystemsService) {}

    @Post('/start/:vocabularyId')
    async placeIntoFirstLeitnerBox(
        @Param('vocabularyId') vocabularyId: string,
        @AuthenticatedUser() user: User,
    ): Promise<void> {
        await this.leitnerSystemsService.placeIntoFirstLeitnerBox(user.id, user.cohortId, vocabularyId);
    }

    @Put('/forward/:vocabularyId')
    async moveForward(@Param('vocabularyId') vocabularyId: string, @AuthenticatedUser() user: User): Promise<void> {
        await this.leitnerSystemsService.moveForward(user.id, user.cohortId, vocabularyId);
    }

    @Put('/backward/:vocabularyId')
    async moveBackward(@Param('vocabularyId') vocabularyId: string, @AuthenticatedUser() user: User): Promise<void> {
        await this.leitnerSystemsService.moveBackward(user.id, user.cohortId, vocabularyId);
    }

    @Post('/items/:box')
    @HttpCode(HttpStatus.OK)
    getBoxItems(
        @Param('box') box: LeitnerBoxType,
        @Body('pagination') pagination: Pagination,
        @AuthenticatedUser() user: User,
    ): Promise<SearchResult<LeitnerBoxItem>> {
        return this.leitnerSystemsService.getBoxItems(user.id, box, pagination);
    }

    @Get('/exists/user/:vocabularyId')
    getLeitnerBoxItem(@Param('vocabularyId') vocabularyId: string, @AuthenticatedUser() user: User): Promise<boolean> {
        return this.leitnerSystemsService.isVocabularyExistForUser(user.id, vocabularyId);
    }

    @Get('/items/count/:box')
    countBoxItems(@Param('box') box: LeitnerBoxType, @AuthenticatedUser() user: User): Promise<number> {
        return this.leitnerSystemsService.countBoxItems(user.id, box);
    }
}
