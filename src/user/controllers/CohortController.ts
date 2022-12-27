import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import CohortService from '@/user/services/CohortService';
import Cohort from '@/user/domains/Cohort';
import AuthGuard from '@/common/guards/AuthGuard';
import AuthenticatedUser from '@/common/http/AuthenticatedUser';
import User from '@/user/domains/User';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('/v1/cohorts')
@ApiSecurity('Authorization')
@UseGuards(AuthGuard)
export default class CohortController {
    constructor(private readonly cohortService: CohortService) {}

    @Post()
    async createCohort(@Body() cohort: Cohort): Promise<{ message: string }> {
        await this.cohortService.createCohort(cohort);
        return {
            message: `Please use @Put(/v1/cohorts/:name) API to move all users' vocabularies to the cohort "${cohort.name}"`,
        };
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
