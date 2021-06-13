import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import MeaningRepository from '@/vocabulary/repositories/MeaningRepository';
import VocabularyRepository from '@/vocabulary/repositories/VocabularyRepository';

@Module({
    imports: [TypeOrmModule.forFeature([MeaningRepository, VocabularyRepository])],
    exports: [TypeOrmModule],
})
export default class VocabularyModule {}
