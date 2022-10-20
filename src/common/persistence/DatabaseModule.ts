import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import DatabaseConfig from '@/common/persistence/DatabaseConfig';
import { ConfigModule, ConfigService } from '@nestjs/config';
import DatabaseNamingStrategy from '@/common/persistence/DatabaseNamingStrategy';
import Android from '@/android/domains/Android';
import Cohort from '@/user/domains/Cohort';
import Definition from '@/vocabulary/domains/Definition';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';
import User from '@/user/domains/User';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import AndroidRepository from '@/android/repositories/AndroidRepository';
import CohortRepository from '@/user/repositories/CohortRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import UserRepository from '@/user/repositories/UserRepository';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import { ConnectionOptions, LoggerOptions } from 'typeorm';
import { DatabaseType } from 'typeorm/driver/types/DatabaseType';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (): TypeOrmModuleOptions => {
                // do we need it?
                // https://typeorm.io/#/using-ormconfig/which-configuration-file-is-used-by-typeorm
                // Which configuration file is used by Typeorm?
                // From the environment variables. Typeorm will attempt to load the .env file using dotEnv if it exists.
                // ...
                const databaseConfig = new DatabaseConfig();

                const connectionOptions: ConnectionOptions = {
                    type: databaseConfig.type as DatabaseType,
                    host: databaseConfig.host,
                    port: databaseConfig.port,
                    username: databaseConfig.username,
                    password: databaseConfig.password,
                    database: databaseConfig.database,
                    logging: databaseConfig.logging as LoggerOptions,
                    // do not use the environment variable TYPEORM_ENTITIES
                    // as it won't work with npm run start:prod
                    // as directory is ***/dist/***
                    entities: [Android, Cohort, Definition, LeitnerSystems, User, Vocabulary],
                    namingStrategy: new DatabaseNamingStrategy(),
                } as ConnectionOptions;

                return {
                    retryAttempts: 1,
                    synchronize: false,
                    autoLoadEntities: false,
                    ...{
                        ...connectionOptions,
                    },
                };
            },
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([
            AndroidRepository,
            CohortRepository,
            DefinitionRepository,
            LeitnerSystemsRepository,
            UserRepository,
            VocabularyRepository,
        ]),
    ],
    exports: [TypeOrmModule],
})
export default class DatabaseModule {}
