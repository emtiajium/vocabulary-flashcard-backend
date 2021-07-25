import { Module } from '@nestjs/common';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';
import { TypeOrmModule } from '@nestjs/typeorm';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import UserService from '@/user/services/UserService';
import UserRepository from '@/user/repositories/UserRepository';
import CohortService from '@/user/services/CohortService';
import CohortRepository from '@/user/repositories/CohortRepository';
import LeitnerSystems from '@/vocabulary/domains/LeitnerSystems';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserRepository,
            CohortRepository,
            VocabularyRepository,
            DefinitionRepository,
            LeitnerSystems,
        ]),
    ],
    providers: [UserService, CohortService, VocabularyService],
    controllers: [VocabularyController],
})
export default class VocabularyModule {}
