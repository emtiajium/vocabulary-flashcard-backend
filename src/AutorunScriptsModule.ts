import { Logger, Module } from '@nestjs/common';
import CreateDefaultCohort from '@/auto-run-scripts/1623557103708-create-default-cohort';

@Module({
    providers: [CreateDefaultCohort, Logger],
})
export default class AutorunScriptsModule {}
