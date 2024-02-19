import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import DatabaseConfig from '@/common/persistence/DatabaseConfig';
import { ConfigService } from '@nestjs/config';

config();

const persistence = new DatabaseConfig();
const { host, port, username, password, database, type } = persistence;

const configService = new ConfigService();

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
