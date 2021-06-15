import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';

@Module({
    imports: [TypeOrmModule.forFeature([DefinitionRepository, VocabularyRepository])],
    exports: [TypeOrmModule],
    providers: [VocabularyService],
    controllers: [VocabularyController],
})
export default class VocabularyModule {}
