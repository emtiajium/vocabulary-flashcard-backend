import { Logger, Module } from '@nestjs/common';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';
import UserService from '@/user/services/UserService';
import CohortService from '@/user/services/CohortService';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import LeitnerSystemsController from '@/vocabulary/controllers/LeitnerSystemsController';
import DatabaseModule from '@/common/persistence/DatabaseModule';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [DatabaseModule],
    providers: [UserService, CohortService, VocabularyService, LeitnerSystemsService, Logger, ConfigService],
    controllers: [VocabularyController, LeitnerSystemsController],
})
export default class VocabularyModule {}
