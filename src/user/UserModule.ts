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

@Module({
    imports: [DatabaseModule],
    controllers: [UserController, CohortController],
    providers: [UserService, CohortService, VocabularyService, DeletionService, Logger, ConfigService, TokenManager],
})
export default class UserModule {}
