import { INestApplication, Injectable, Logger } from '@nestjs/common';
import CreateDefaultCohort from '@/auto-run-scripts/1623557103708-create-default-cohort';
import { ClassType } from '@/common/types/ClassType';

@Injectable()
export default class AutoRunScripts {
    private readonly logger: Logger;

    constructor(private readonly app: INestApplication) {
        this.logger = app.get(Logger);
        this.logger.setContext(AutoRunScripts.name);
    }

    async runScripts(): Promise<void> {
        const files = this.getFiles();
        await Promise.all(
            files.map((file) => {
                return this.app.get(file.name).runScript();
            }),
        );
        this.logger.log(`All scripts have been executed`);
    }

    private getFiles = (): ClassType<CreateDefaultCohort>[] => [CreateDefaultCohort];
}
