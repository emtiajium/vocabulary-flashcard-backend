import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import CohortService from '@/user/services/CohortService';
import Cohort from '@/user/domains/Cohort';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import User from '@/user/domains/User';

@Controller('/v1/cohorts')
export default class CohortController {
    constructor(private readonly cohortService: CohortService) {}

    @Post()
    @UseGuards(AuthGuard)
    async createCohort(@Body() cohort: Cohort): Promise<void> {
        await this.cohortService.createCohort(cohort);
    }

    @Put('/:name')
    @UseGuards(AuthGuard)
    async addUsersToCohort(@Body() userIds: string[], @Param('name') name: string): Promise<void> {
        await this.cohortService.addUsersToCohort(name, userIds);
    }

    @Get('/self')
    @UseGuards(AuthGuard)
    async findCohortById(@AuthenticatedUser() user: User): Promise<Cohort> {
        return this.cohortService.findCohortById(user.cohortId);
    }
}
