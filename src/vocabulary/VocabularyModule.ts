import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import MeaningRepository from '@/vocabulary/repositories/MeaningRepository';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';

@Module({
    imports: [TypeOrmModule.forFeature([MeaningRepository, VocabularyRepository])],
    exports: [TypeOrmModule],
    providers: [VocabularyService],
    controllers: [VocabularyController],
})
export default class VocabularyModule {}
