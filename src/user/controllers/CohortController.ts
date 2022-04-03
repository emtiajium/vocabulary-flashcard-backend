import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import CohortService from '@/user/services/CohortService';
import Cohort from '@/user/domains/Cohort';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http-decorators/AuthenticatedUser';
import User from '@/user/domains/User';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('/v1/cohorts')
@ApiSecurity('Authorization')
@UseGuards(AuthGuard)
export default class CohortController {
    constructor(private readonly cohortService: CohortService) {}

    @Post()
    async createCohort(@Body() cohort: Cohort): Promise<void> {
        await this.cohortService.createCohort(cohort);
    }

    @Put('/:name')
    async addUsersToCohort(@Body() usernames: string[], @Param('name') name: string): Promise<void> {
        await this.cohortService.addUsersToCohort(name, usernames);
    }

    @Get('/self')
    findCohortById(@AuthenticatedUser() user: User): Promise<Cohort> {
        return this.cohortService.findCohortById(user.cohortId);
    }
}
