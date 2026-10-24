import { DataSource } from 'typeorm';
import DatabaseConfig from '../../src/common/persistence/DatabaseConfig';

function createMigrationDataSource(): DataSource {
    const { type, host, port, username, password, database, migrations } = new DatabaseConfig();

    return new DataSource({
        type,
        host,
        port,
        username,
        password,
        database,
        synchronize: false,
        logging: false,
        entities: [],
        migrations: [migrations],
    });
}

export async function runMigrations(): Promise<void> {
    const dataSource = createMigrationDataSource();

    await dataSource.initialize();

    try {
        await dataSource.runMigrations();
    } finally {
        await dataSource.destroy();
    }
}
