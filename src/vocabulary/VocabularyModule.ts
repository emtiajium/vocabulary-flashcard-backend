import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';

@Module({
    exports: [TypeOrmModule],
    providers: [VocabularyService],
    controllers: [VocabularyController],
})
export default class VocabularyModule {}
