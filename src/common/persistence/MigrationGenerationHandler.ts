/* eslint-disable no-console */
/* eslint-disable node/no-sync */
/* eslint-disable unicorn/no-process-exit */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

class MigrationGenerationHandler {
    private readonly encoding = 'utf8';

    private readonly migrationConfigFileName = 'MigrationConfig.ts';

    private environmentVariableFileContents: string;

    private isEnvironmentVariableFileExist = false;

    private isEnvironmentVariableFileRemoved = false;

    private isMigrationConfigFileCreated = false;

    constructor(private readonly environmentVariableFileName: string) {}

    execute(): void {
        try {
            this.assertEnvironmentVariableFileExistence();
            this.validateExecution();
            this.getEnvironmentVariableFileContents();
            this.removeEnvironmentVariableFile();
            this.createMigrationConfigFile();
            this.generateMigrationQueries();
        } catch (error) {
            console.error(error);
        } finally {
            this.removeMigrationConfigFile();
            this.createEnvironmentVariableFile();
        }
    }

    private assertEnvironmentVariableFileExistence(): void {
        this.isEnvironmentVariableFileExist = existsSync(this.environmentVariableFileName);
    }

    private validateExecution(): void {
        if (!this.isEnvironmentVariableFileExist) {
            console.error(`Please create the .env file`);
            process.exit(1);
        }
    }

    private getEnvironmentVariableFileContents(): void {
        this.environmentVariableFileContents = readFileSync(this.environmentVariableFileName, {
            encoding: this.encoding,
        });
    }

    private removeEnvironmentVariableFile(): void {
        unlinkSync(this.environmentVariableFileName);
        this.isEnvironmentVariableFileRemoved = true;
    }

    private createEnvironmentVariableFile(): void {
        if (this.isEnvironmentVariableFileRemoved) {
            writeFileSync(this.environmentVariableFileName, this.environmentVariableFileContents, {
                encoding: this.encoding,
            });
        }
    }

    private getEnvironmentVariableValue(key: string): string {
        let value: string;

        this.environmentVariableFileContents.split('\n').forEach((pair) => {
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
            import { DataSource } from 'typeorm';
            import DatabaseNamingStrategy from '@/common/persistence/DatabaseNamingStrategy';
        
            export default new DataSource({
                synchronize: false,
                type: '${this.getEnvironmentVariableValue('TYPEORM_CONNECTION')}',
                host: '${this.getEnvironmentVariableValue('TYPEORM_HOST')}',
                port: ${Number.parseInt(this.getEnvironmentVariableValue('TYPEORM_PORT'), 10)},
                username: '${this.getEnvironmentVariableValue('TYPEORM_USERNAME')}',
                password: '${this.getEnvironmentVariableValue('TYPEORM_PASSWORD')}',
                database: '${this.getEnvironmentVariableValue('TYPEORM_DATABASE')}',
                entities: ['${this.getEnvironmentVariableValue('TYPEORM_ENTITIES')}'],
                migrations: ['${this.getEnvironmentVariableValue('TYPEORM_MIGRATIONS')}'],
                namingStrategy: new DatabaseNamingStrategy(),
            });`,
        );

        this.isMigrationConfigFileCreated = true;
    }

    private removeMigrationConfigFile(): void {
        if (this.isMigrationConfigFileCreated) {
            unlinkSync(this.migrationConfigFileName);
        }
    }

    private getMigrationFileName(): string {
        const { 2: migrationFileName } = process.argv;
        return migrationFileName;
    }

    private getMigrationDirectory(): string {
        return this.getEnvironmentVariableValue('TYPEORM_MIGRATIONS_DIR');
    }

    private generateMigrationQueries(): void {
        const output = execSync(
            `npm run typeorm migration:generate ${this.getMigrationDirectory()}/${this.getMigrationFileName()} -- --pretty --dataSource ${this.migrationConfigFileName}`,
            { encoding: this.encoding },
        );

        console.info(output);
    }
}

new MigrationGenerationHandler('.env').execute();
