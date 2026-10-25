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

        const previousDefinitionIds: string[] = [];
        // Today's round is only the round in progress while it is unfinished. Once the
        // user has answered every word, the next request deals a new set, and today's
        // words stay in `previousDefinitionIds` so the new one cannot repeat them.
        const definitionsFromToday: RandomlyChosenMeaningQueryResponse[] = [];

        previousDefinitions.forEach((previousDefinition) => {
            previousDefinitionIds.push(previousDefinition.definitionId);
            if (previousDefinition.isCreationDateToday && !previousDefinition.completedAt) {
                definitionsFromToday.push({
                    definitionId: previousDefinition.definitionId,
                    word: previousDefinition.word,
                    meaning: previousDefinition.meaning,
                });
            }
        });

        const definitionFromTodayExists = definitionsFromToday.length > 0;

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

    /** Ends today's round, so the next request starts a new game. */
    async completeTodaysRound(userId: string): Promise<void> {
        await this.guessingGameRepository.completeTodaysByUserId(userId);
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
