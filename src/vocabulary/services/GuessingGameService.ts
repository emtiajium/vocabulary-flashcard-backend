import { Injectable } from '@nestjs/common';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import { shuffle } from 'lodash';
import { RandomlyChosenMeaningResponse } from '@/vocabulary/domains/RandomlyChosenMeaningResponse';
import WordsApiAdapter from '@/vocabulary/adapters/WordsApiAdapter';
import GuessingGameRepository from '@/vocabulary/repositories/GuessingGameRepository';

@Injectable()
export default class GuessingGameService {
    constructor(
        private readonly definitionRepository: DefinitionRepository,
        private readonly guessingGameRepository: GuessingGameRepository,
        private readonly wordsApiAdapter: WordsApiAdapter,
    ) {}

    async getRandomlyChosenMeanings(cohortId: string, userId: string): Promise<RandomlyChosenMeaningResponse[]> {
        const randomlyChosenMeaningResponsesFromExternalService = await this.wordsApiAdapter.getRandomWords();

        const previousDefinitionIds = await this.guessingGameRepository.getDefinitionIdsByUserId(userId);

        let randomlyChosenMeaningResponses = await this.definitionRepository.getRandomlyChosenMeanings(
            cohortId,
            previousDefinitionIds,
        );

        if (randomlyChosenMeaningResponses.length === 0) {
            randomlyChosenMeaningResponses = await this.definitionRepository.getAnyMeanings(
                cohortId,
                previousDefinitionIds,
            );
        }

        const definitionIds = randomlyChosenMeaningResponses.map((randomlyChosenMeaningResponse) => {
            return randomlyChosenMeaningResponse.definitionId;
        });

        this.guessingGameRepository.insertMultiples(definitionIds, userId).finally();

        return shuffle([
            ...randomlyChosenMeaningResponsesFromExternalService,
            ...randomlyChosenMeaningResponses.map(({ meaning, word }) => {
                return {
                    meaning,
                    word,
                };
            }),
        ]);
    }

    async deleteOlder(): Promise<void> {
        await this.guessingGameRepository.deleteOlder();
    }
}
