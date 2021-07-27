import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import User from '@/user/domains/User';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import Pagination from '@/common/domains/Pagination';
import SearchResult from '@/common/domains/SearchResult';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

@Controller('/v1/leitner-systems')
export default class LeitnerSystemsController {
    constructor(private readonly leitnerSystemsService: LeitnerSystemsService) {}

    @Post('/start/:vocabularyId')
    @UseGuards(AuthGuard)
    async placeIntoFirstLeitnerBox(
        @Param('vocabularyId') vocabularyId: string,
        @AuthenticatedUser() user: User,
    ): Promise<void> {
        await this.leitnerSystemsService.placeIntoFirstLeitnerBox(user.id, user.cohortId, vocabularyId);
    }

    @Put('/forward/:vocabularyId')
    @UseGuards(AuthGuard)
    async moveForward(@Param('vocabularyId') vocabularyId: string, @AuthenticatedUser() user: User): Promise<void> {
        await this.leitnerSystemsService.moveForward(user.id, user.cohortId, vocabularyId);
    }

    @Put('/backward/:vocabularyId')
    @UseGuards(AuthGuard)
    async moveBackward(@Param('vocabularyId') vocabularyId: string, @AuthenticatedUser() user: User): Promise<void> {
        await this.leitnerSystemsService.moveBackward(user.id, user.cohortId, vocabularyId);
    }

    @Post('/items/:box')
    @UseGuards(AuthGuard)
    async getBoxItems(
        @Param('box') box: LeitnerBoxType,
        @Body('pagination') pagination: Pagination,
        @AuthenticatedUser() user: User,
    ): Promise<SearchResult<LeitnerSystems>> {
        return this.leitnerSystemsService.getBoxItems(user.id, box, pagination);
    }
}
