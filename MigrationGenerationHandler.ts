/* eslint-disable no-console */
/* eslint-disable unicorn/prefer-node-protocol */
/* eslint-disable node/no-sync */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

class MigrationGenerationHandler {
    private readonly migrationConfigFileName = 'MigrationConfig.ts';

    private readonly isEnvironmentVariableFileExist: boolean = false;

    private readonly migrationFileName: string;

    private originalEnvironmentVariableFileContents: string;

    constructor(private readonly environmentVariableFileName: string) {
        this.isEnvironmentVariableFileExist = existsSync(this.environmentVariableFileName);

        const { 2: migrationFileName } = process.argv;
        this.migrationFileName = migrationFileName;
    }

    execute(): void {
        if (this.isEnvironmentVariableFileExist) {
            this.saveOriginalEnvironmentVariableFileContents();
            this.removeEnvironmentVariableFile();
        }

        this.createMigrationConfigFile();
        this.generateMigrationQueries();

        this.removeMigrationConfigFile();

        if (this.isEnvironmentVariableFileExist) {
            this.createEnvironmentVariableFile();
        }
    }

    private saveOriginalEnvironmentVariableFileContents(): void {
        this.originalEnvironmentVariableFileContents = readFileSync(this.environmentVariableFileName, {
            encoding: 'utf-8',
        });
    }

    private removeEnvironmentVariableFile(): void {
        unlinkSync(this.environmentVariableFileName);
    }

    private createEnvironmentVariableFile(): void {
        writeFileSync(this.environmentVariableFileName, this.originalEnvironmentVariableFileContents, {
            encoding: 'utf-8',
        });
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
                type: 'postgres',
                host: 'localhost',
                port: 5431,
                username: 'postgres',
                password: '123',
                database: 'ielts-gibberish',
                entities: ['src/**/domains/*.ts'],
                migrations: ['migrations/*.ts'],
                cli: {
                    migrationsDir: 'migrations',
                },
                namingStrategy: new DatabaseNamingStrategy(),
            };`,
        );

        execSync(`prettier --write ${this.migrationConfigFileName}`);
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
