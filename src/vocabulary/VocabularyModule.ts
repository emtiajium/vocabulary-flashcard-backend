import { Logger, Module } from '@nestjs/common';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';
import UserService from '@/user/services/UserService';
import CohortService from '@/user/services/CohortService';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import LeitnerSystemsController from '@/vocabulary/controllers/LeitnerSystemsController';
import DatabaseModule from '@/common/persistence/DatabaseModule';
import { ConfigService } from '@nestjs/config';
import TokenManager from '@/common/services/TokenManager';
import CacheUserService from '@/user/services/CacheUserService';
import UserRepository from '@/user/repositories/UserRepository';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import CohortRepository from '@/user/repositories/CohortRepository';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import { HttpModule } from '@nestjs/axios';
import WordsApiAdapter from '@/vocabulary/adapters/WordsApiAdapter';
import GuessingGameRepository from '@/vocabulary/repositories/GuessingGameRepository';
import GuessingGameService from '@/vocabulary/services/GuessingGameService';
import { ScheduleModule } from '@nestjs/schedule';
import DeleteOldRandomDefinitionsJob from '@/vocabulary/jobs/DeleteOldRandomDefinitionsJob';

@Module({
    imports: [DatabaseModule, HttpModule, ScheduleModule.forRoot()],
    providers: [
        UserService,
        CohortService,
        VocabularyService,
        LeitnerSystemsService,
        Logger,
        ConfigService,
        TokenManager,
        CacheUserService,
        UserRepository,
        LeitnerSystemsRepository,
        CohortRepository,
        VocabularyRepository,
        DefinitionRepository,
        WordsApiAdapter,
        GuessingGameRepository,
        GuessingGameService,
        DeleteOldRandomDefinitionsJob,
    ],
    controllers: [VocabularyController, LeitnerSystemsController],
})
export default class VocabularyModule {}
