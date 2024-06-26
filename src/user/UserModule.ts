import { Logger, Module } from '@nestjs/common';
import UserController from '@/user/controllers/UserController';
import UserService from '@/user/services/UserService';
import CohortService from '@/user/services/CohortService';
import CohortController from '@/user/controllers/CohortController';
import DatabaseModule from '@/common/persistence/DatabaseModule';
import { ConfigService } from '@nestjs/config';
import TokenManager from '@/common/services/TokenManager';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import DeletionService from '@/user/services/DeletionService';
import CacheUserService from '@/user/services/CacheUserService';
import UserRepository from '@/user/repositories/UserRepository';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import CohortRepository from '@/user/repositories/CohortRepository';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import { HttpModule } from '@nestjs/axios';
import WordsApiAdapter from '@/vocabulary/adapters/WordsApiAdapter';
import GuessingGameService from '@/vocabulary/services/GuessingGameService';
import GuessingGameRepository from '@/vocabulary/repositories/GuessingGameRepository';

@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [UserController, CohortController],
    providers: [
        UserService,
        CohortService,
        VocabularyService,
        DeletionService,
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
        GuessingGameService,
        GuessingGameRepository,
    ],
})
export default class UserModule {}
