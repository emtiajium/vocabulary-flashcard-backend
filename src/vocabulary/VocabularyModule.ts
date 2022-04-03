import { Logger, Module } from '@nestjs/common';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';
import { TypeOrmModule } from '@nestjs/typeorm';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import UserService from '@/user/services/UserService';
import UserRepository from '@/user/repositories/UserRepository';
import CohortService from '@/user/services/CohortService';
import CohortRepository from '@/user/repositories/CohortRepository';
import LeitnerSystemsService from '@/vocabulary/services/LeitnerSystemsService';
import LeitnerSystemsController from '@/vocabulary/controllers/LeitnerSystemsController';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserRepository,
            CohortRepository,
            VocabularyRepository,
            DefinitionRepository,
            LeitnerSystemsRepository,
        ]),
    ],
    providers: [UserService, CohortService, VocabularyService, LeitnerSystemsService, Logger],
    controllers: [VocabularyController, LeitnerSystemsController],
})
export default class VocabularyModule {}
