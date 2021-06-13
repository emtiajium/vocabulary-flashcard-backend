import * as fs from 'fs';
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
        const files = await this.getScripts();
        // parallel execution is okay for now
        // we may need to execute the scripts sequentially in future
        await Promise.all(
            files.map((script) => {
                return this.app.get(script.name).runScript();
            }),
        );
        this.logger.log(`All scripts have been executed`);
    }

    private async getScripts(): Promise<ClassType<CreateDefaultCohort>[]> {
        const files = await this.getScriptNames();
        return files.map((file) => {
            const script = require(`./${file}`);
            return script.default;
        });
    }

    async getScriptNames(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(__dirname, (error, files) => {
                if (error) {
                    return reject(error);
                }
                return resolve(files.filter((file) => file.endsWith('.js') && file !== 'index.js'));
            });
        });
    }
}
