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
import { LoggerOptions } from 'typeorm';
import GuessingGame from '@/vocabulary/domains/GuessingGame';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (): TypeOrmModuleOptions => {
                const databaseConfig = new DatabaseConfig();

                const connectionOptions = {
                    type: databaseConfig.type,
                    host: databaseConfig.host,
                    port: databaseConfig.port,
                    username: databaseConfig.username,
                    password: databaseConfig.password,
                    database: databaseConfig.database,
                    logging: databaseConfig.logging as LoggerOptions,
                    // do not use the environment variable TYPEORM_ENTITIES
                    // as it won't work with npm run start:prod
                    // as directory is ***/dist/***
                    entities: [Android, Cohort, Definition, LeitnerSystems, User, Vocabulary, GuessingGame],
                    namingStrategy: new DatabaseNamingStrategy(),
                };

                return {
                    retryAttempts: 1,
                    synchronize: false,
                    autoLoadEntities: false,
                    ...connectionOptions,
                };
            },
        }),
    ],
    exports: [TypeOrmModule],
})
export default class DatabaseModule {}
