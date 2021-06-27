import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import DatabaseConfig from '@/common/configs/DatabaseConfig';
import { ConfigModule, ConfigService } from '@nestjs/config';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import UserRepository from '@/user/repositories/UserRepository';
import CohortRepository from '@/user/repositories/CohortRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [
                ConfigModule,
                TypeOrmModule.forFeature([
                    UserRepository,
                    CohortRepository,
                    VocabularyRepository,
                    DefinitionRepository,
                ]),
            ],
            useFactory: (): TypeOrmModuleOptions => {
                // do we need it?
                // https://typeorm.io/#/using-ormconfig/which-configuration-file-is-used-by-typeorm
                // Which configuration file is used by Typeorm?
                // From the environment variables. Typeorm will attempt to load the .env file using dotEnv if it exists.
                // ...
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
                    entities,
                    synchronize,
                    migrations,
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
