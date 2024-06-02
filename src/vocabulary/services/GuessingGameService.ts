import { Injectable } from '@nestjs/common';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';
import { shuffle } from 'lodash';
import {
    RandomlyChosenMeaningQueryResponse,
    RandomlyChosenMeaningResponse,
} from '@/vocabulary/domains/RandomlyChosenMeaningResponse';
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
        const [randomlyChosenMeaningResponsesFromExternalService, previousDefinitions] = await Promise.all([
            this.wordsApiAdapter.getRandomWords(),
            this.guessingGameRepository.getByUserId(userId),
        ]);

        let definitionFromTodayExists = false;
        const previousDefinitionIds: string[] = [];
        const definitionsFromToday: RandomlyChosenMeaningQueryResponse[] = [];

        previousDefinitions.forEach((previousDefinition) => {
            previousDefinitionIds.push(previousDefinition.definitionId);
            if (previousDefinition.isCreationDateToday) {
                definitionFromTodayExists = true;
                definitionsFromToday.push({
                    definitionId: previousDefinition.definitionId,
                    word: previousDefinition.word,
                    meaning: previousDefinition.meaning,
                });
            }
        });

        let randomlyChosenMeaningResponses = definitionFromTodayExists
            ? definitionsFromToday
            : await this.definitionRepository.getRandomlyChosenMeanings(cohortId, userId, previousDefinitionIds);

        if (randomlyChosenMeaningResponses.length === 0) {
            randomlyChosenMeaningResponses = await this.definitionRepository.getAnyMeanings(
                cohortId,
                previousDefinitionIds,
            );
        }

        if (!definitionFromTodayExists) {
            this.save(randomlyChosenMeaningResponses, userId).finally();
        }

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

    async deleteByUserId(userId: string): Promise<void> {
        await this.guessingGameRepository.deleteByUserId(userId);
    }

    private async save(
        randomlyChosenMeaningResponses: RandomlyChosenMeaningQueryResponse[],
        userId: string,
    ): Promise<void> {
        await this.guessingGameRepository.insertMultiples(randomlyChosenMeaningResponses, userId);
    }
}
