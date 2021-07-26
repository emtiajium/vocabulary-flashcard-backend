import { Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import User from '@/user/domains/User';

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
}
