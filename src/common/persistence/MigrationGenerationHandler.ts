/* eslint-disable no-console */
/* eslint-disable unicorn/prefer-node-protocol */
/* eslint-disable node/no-sync */
/* eslint-disable unicorn/no-process-exit */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

class MigrationGenerationHandler {
    private readonly migrationConfigFileName = 'MigrationConfig.ts';

    private readonly isEnvironmentVariableFileExist: boolean = false;

    private readonly migrationFileName: string;

    private originalEnvironmentVariableFileContents: string;

    private isEnvironmentVariableFileRemoved = false;

    constructor(private readonly environmentVariableFileName: string) {
        this.isEnvironmentVariableFileExist = existsSync(this.environmentVariableFileName);

        const { 2: migrationFileName } = process.argv;
        this.migrationFileName = migrationFileName;
    }

    execute(): void {
        try {
            this.validateExecution();
            this.saveOriginalEnvironmentVariableFileContents();
            this.removeEnvironmentVariableFile();
            this.createMigrationConfigFile();
            this.generateMigrationQueries();
            this.removeMigrationConfigFile();
        } catch (error) {
            console.error(error);
        } finally {
            if (this.isEnvironmentVariableFileRemoved) {
                this.createEnvironmentVariableFile();
            }
        }
    }

    private validateExecution(): void {
        if (!this.isEnvironmentVariableFileExist) {
            console.error(`Please create the .env file`);
            process.exit(1);
        }
    }

    private saveOriginalEnvironmentVariableFileContents(): void {
        this.originalEnvironmentVariableFileContents = readFileSync(this.environmentVariableFileName, {
            encoding: 'utf-8',
        });
    }

    private removeEnvironmentVariableFile(): void {
        unlinkSync(this.environmentVariableFileName);
        this.isEnvironmentVariableFileRemoved = true;
    }

    private createEnvironmentVariableFile(): void {
        writeFileSync(this.environmentVariableFileName, this.originalEnvironmentVariableFileContents, {
            encoding: 'utf-8',
        });
    }

    private getEnvironmentVariableValue(key: string): string {
        let value: string;

        this.originalEnvironmentVariableFileContents.split('\n').forEach((pair) => {
            if (pair.search(`${key}=`) !== -1) {
                [, value] = pair.split(`${key}=`);
            }
        });

        return value;
    }

    private createMigrationConfigFile(): void {
        writeFileSync(
            this.migrationConfigFileName,
            `
            import DatabaseNamingStrategy from '@/common/persistence/DatabaseNamingStrategy';
        
            export = {
                retryAttempts: 1,
                synchronize: false,
                autoLoadEntities: false,
                type: '${this.getEnvironmentVariableValue('TYPEORM_CONNECTION')}',
                host: '${this.getEnvironmentVariableValue('TYPEORM_HOST')}',
                port: ${Number.parseInt(this.getEnvironmentVariableValue('TYPEORM_PORT'), 10)},
                username: '${this.getEnvironmentVariableValue('TYPEORM_USERNAME')}',
                password: '${this.getEnvironmentVariableValue('TYPEORM_PASSWORD')}',
                database: '${this.getEnvironmentVariableValue('TYPEORM_DATABASE')}',
                entities: ['${this.getEnvironmentVariableValue('TYPEORM_ENTITIES')}'],
                migrations: ['${this.getEnvironmentVariableValue('TYPEORM_MIGRATIONS')}'],
                cli: {
                    migrationsDir: '${this.getEnvironmentVariableValue('TYPEORM_MIGRATIONS_DIR')}',
                },
                namingStrategy: new DatabaseNamingStrategy(),
            };`,
        );
    }

    private removeMigrationConfigFile(): void {
        unlinkSync(this.migrationConfigFileName);
    }

    private generateMigrationQueries(): void {
        const output = execSync(
            `npm run typeorm migration:generate -- --pretty --config ${this.migrationConfigFileName} --name ${this.migrationFileName}`,
            { encoding: 'utf8' },
        );

        console.info(output);
    }
}

new MigrationGenerationHandler('.env').execute();
