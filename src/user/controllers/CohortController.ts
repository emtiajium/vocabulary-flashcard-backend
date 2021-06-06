import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import CohortService from '@/user/services/CohortService';
import Cohort from '@/user/domains/Cohort';

@Controller('/v1/cohorts')
export default class CohortController {
    constructor(private readonly cohortService: CohortService) {}

    @Post()
    async createCohort(@Body() cohort: Cohort): Promise<void> {
        await this.cohortService.createCohort(cohort);
    }

    @Put('/:name')
    async addUsersToCohort(@Body() userIds: string[], @Param('id') name: string): Promise<void> {
        await this.cohortService.addUsersToCohort(name, userIds);
    }
}
