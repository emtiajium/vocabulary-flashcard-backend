import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http/AuthenticatedUser';
import User from '@/user/domains/User';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import Pagination from '@/common/domains/Pagination';
import { ApiSecurity } from '@nestjs/swagger';
import LeitnerBoxItemSearchResult from '@/vocabulary/domains/LeitnerBoxItemSearchResult';

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
        @AuthenticatedUser('id') userId: string,
    ): Promise<LeitnerBoxItemSearchResult> {
        return this.leitnerSystemsService.getBoxItems(userId, box, pagination);
    }

    @Get('/items/count/:box')
    countBoxItems(@Param('box') box: LeitnerBoxType, @AuthenticatedUser('id') userId: string): Promise<number> {
        return this.leitnerSystemsService.countBoxItems(userId, box);
    }
}
