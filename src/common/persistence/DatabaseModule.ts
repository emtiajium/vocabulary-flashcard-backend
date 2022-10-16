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
                const { host, port, username, password, database, connection, logging } = databaseConfig;

                return {
                    retryAttempts: 1,
                    type: connection,
                    host,
                    port,
                    username,
                    password,
                    database,
                    // do not use the environment variable TYPEORM_ENTITIES
                    // as it won't work with npm run start:prod
                    // as directory is ***/dist/***
                    entities: [Android, Cohort, Definition, LeitnerSystems, User, Vocabulary],
                    synchronize: false,
                    logging,
                    namingStrategy: new DatabaseNamingStrategy(),
                } as TypeOrmModuleOptions;
            },
            inject: [ConfigService],
        }),
    ],
    exports: [TypeOrmModule],
})
export default class DatabaseModule {}
