import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import DatabaseConfig from '@/common/persistence/DatabaseConfig';

config();

const { host, port, username, password, database, type, entities, migrations } = new DatabaseConfig();

export default new DataSource({
    type,
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    entities: [entities],
    migrations: [migrations],
});
