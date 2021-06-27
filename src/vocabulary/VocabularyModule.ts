import { Module } from '@nestjs/common';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import VocabularyController from '@/vocabulary/controllers/VocabularyController';

@Module({
    providers: [VocabularyService],
    controllers: [VocabularyController],
})
export default class VocabularyModule {}
