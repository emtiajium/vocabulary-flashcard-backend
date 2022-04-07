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
        const scripts = await this.getScripts();
        // parallel execution is okay for now
        // we may need to execute the scripts sequentially in future
        await Promise.all(
            scripts.map((script) => {
                return this.app.get(script.name).runScript();
            }),
        );
        this.logger.log(`All scripts have been executed`);
    }

    private async getScripts(): Promise<ClassType<CreateDefaultCohort>[]> {
        const scripts = await this.getScriptNames();
        return scripts.map((scriptName) => {
            const script = require(`./${scriptName}`);
            return script.default;
        });
    }

    getScriptNames(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(__dirname, (error, files) => {
                if (error) {
                    return reject(error);
                }
                return resolve(
                    // .js file as it is supposed to execute from the build folder
                    files.filter((file) => Number.isInteger(Number.parseInt(file, 10)) && file.endsWith('.js')),
                );
            });
        });
    }
}
