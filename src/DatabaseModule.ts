import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import DatabaseConfig from '@/common/DatabaseConfig';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: (): TypeOrmModuleOptions => {
                const databaseConfig = new DatabaseConfig();
                const {
                    host,
                    port,
                    username,
                    password,
                    database,
                    synchronize,
                    connection,
                    entities,
                    migrations,
                    migrationDirectory,
                } = databaseConfig;
                return {
                    type: connection,
                    host,
                    port,
                    username,
                    password,
                    database,
                    entities,
                    synchronize,
                    migrations,
                    cli: {
                        migrationsDir: migrationDirectory,
                    },
                } as TypeOrmModuleOptions;
            },
        }),
    ],
    exports: [TypeOrmModule],
})
export default class DatabaseModule {}
