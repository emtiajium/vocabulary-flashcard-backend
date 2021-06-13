import { Logger, Module } from '@nestjs/common';
import CreateDefaultCohort from '@/auto-run-scripts/1623557103708-create-default-cohort';
import { TypeOrmModule } from '@nestjs/typeorm';
import CohortRepository from '@/user/repositories/CohortRepository';

@Module({
    imports: [TypeOrmModule.forFeature([CohortRepository])],
    providers: [CreateDefaultCohort, Logger],
})
export default class AutorunScriptsModule {}
