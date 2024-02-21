import { Logger, Module } from '@nestjs/common';
import CreateDefaultCohort from '@/auto-run-scripts/1623557103708-create-default-cohort';
import DatabaseModule from '@/common/persistence/DatabaseModule';
import CohortRepository from './user/repositories/CohortRepository';

@Module({
    imports: [DatabaseModule],
    providers: [CreateDefaultCohort, Logger, CohortRepository],
})
export default class AutorunScriptsModule {}
