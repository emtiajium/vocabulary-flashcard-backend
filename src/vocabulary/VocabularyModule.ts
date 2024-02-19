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

@Module({
    imports: [DatabaseModule],
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
    ],
    controllers: [VocabularyController, LeitnerSystemsController],
})
export default class VocabularyModule {}
