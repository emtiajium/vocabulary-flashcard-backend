/* eslint-disable node/no-process-env */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import DatabaseConfig from '@/common/persistence/DatabaseConfig';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'node:child_process';
import * as process from 'node:process';

const configService = new ConfigService();

if (process.env.FIRECRACKER_PLATFORM === 'aeb') {
    const environmentVariablesAsString = execSync(`/opt/elasticbeanstalk/bin/get-config environment`, {
        encoding: 'utf8',
    }).trim();
    const environmentVariables = JSON.parse(environmentVariablesAsString);
    configService.set('TYPEORM_CONNECTION', environmentVariables.TYPEORM_CONNECTION);
    configService.set('TYPEORM_HOST', environmentVariables.TYPEORM_HOST);
    configService.set('TYPEORM_PORT', environmentVariables.TYPEORM_PORT);
    configService.set('TYPEORM_USERNAME', environmentVariables.TYPEORM_USERNAME);
    configService.set('TYPEORM_PASSWORD', environmentVariables.TYPEORM_PASSWORD);
    configService.set('TYPEORM_DATABASE', environmentVariables.TYPEORM_DATABASE);
    configService.set('TYPEORM_LOGGING', environmentVariables.TYPEORM_LOGGING);
    configService.set('TYPEORM_CONNECTION', environmentVariables.TYPEORM_CONNECTION);
    configService.set('TYPEORM_MIGRATIONS', environmentVariables.TYPEORM_MIGRATIONS);
} else {
    config();
}

const persistence = new DatabaseConfig();
const { host, port, username, password, database, type } = persistence;

export default new DataSource({
    type,
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    entities: [configService.get<string>('TYPEORM_ENTITIES')],
    migrations: [configService.get<string>('TYPEORM_MIGRATIONS')],
});
