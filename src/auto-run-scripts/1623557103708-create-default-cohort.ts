import CohortRepository from '@/user/repositories/CohortRepository';
import Cohort, { defaultName as defaultCohortName } from '@/user/domains/Cohort';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export default class CreateDefaultCohort {
    constructor(private readonly cohortRepository: CohortRepository, private readonly logger: Logger) {
        this.logger = new Logger(CreateDefaultCohort.name);
    }

    async runScript(): Promise<void> {
        await this.createDefaultCohort();
    }

    async createDefaultCohort(): Promise<void> {
        try {
            await this.cohortRepository
                .createQueryBuilder()
                .insert()
                .into(Cohort)
                .values({ name: () => `'${defaultCohortName}'::VARCHAR` })
                .onConflict(`("name") DO NOTHING`)
                .execute();
            this.logger.log(`Default cohort with name "${defaultCohortName}" has been created`);
        } catch {
            this.logger.error(`Something went wrong while creating the default cohort`);
        }
    }
}
