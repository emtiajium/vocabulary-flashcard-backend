import { Module } from '@nestjs/common';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';
import { TypeOrmModule } from '@nestjs/typeorm';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';

@Module({
    imports: [TypeOrmModule.forFeature([VocabularyRepository, DefinitionRepository])],
    providers: [VocabularyService],
    controllers: [VocabularyController],
})
export default class VocabularyModule {}
