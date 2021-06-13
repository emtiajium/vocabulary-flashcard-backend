import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import DatabaseConfig from '@/common/configs/DatabaseConfig';
import User from '@/user/domains/User';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Cohort from '@/user/domains/Cohort';
import Meaning from '@/vocabulary/domains/Meaning';
import Vocabulary from '@/vocabulary/domains/Vocabulary';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
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
                    migrations,
                    migrationDirectory,
                    logging,
                } = databaseConfig;
                return {
                    retryAttempts: 1,
                    type: connection,
                    host,
                    port,
                    username,
                    password,
                    database,
                    entities: [User, Cohort, Meaning, Vocabulary],
                    synchronize,
                    // eslint-disable-next-line unicorn/prefer-module
                    migrations: [`${__dirname}/${migrations}`],
                    cli: {
                        migrationsDir: migrationDirectory,
                    },
                    logging,
                } as TypeOrmModuleOptions;
            },
            inject: [ConfigService],
        }),
    ],
    exports: [TypeOrmModule],
})
export default class DatabaseModule {}
