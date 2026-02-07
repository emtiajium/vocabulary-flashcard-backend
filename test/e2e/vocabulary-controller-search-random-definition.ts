import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import {
    createVocabulary,
    getVocabularyWithDefinitions,
    removeVocabularyAndRelationsByCohortId,
} from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester } from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import DataSource from '@/common/persistence/TypeormConfig';
import { RandomlyChosenMeaningResponse } from '@/vocabulary/domains/RandomlyChosenMeaningResponse';
import WordsApiAdapter from '@/vocabulary/adapters/WordsApiAdapter';
import GuessingGameRepository from '@/vocabulary/repositories/GuessingGameRepository';
import MomentUnit, { makeItOlder } from '@/common/utils/moment-util';
import DefinitionRepository from '@/vocabulary/repositories/DefinitionRepository';

describe('GET /v1/vocabularies/definitions/random-search', () => {
    let app: INestApplication;

    let requester: User;
    let cohort: Cohort;
    let getRandomWordMock: jest.SpyInstance;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
        requester = await createApiRequester();
        cohort = await createCohort({
            name: `Cohort _ ${uuid.v4()}`,
            usernames: [requester.username],
        } as Cohort);
        requester.cohortId = cohort.id;
        // @ts-expect-error need to mock a private method
        getRandomWordMock = jest.spyOn(WordsApiAdapter.prototype, 'getRandomWord');
    });

    afterAll(async () => {
        getRandomWordMock.mockRestore();
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.get(GuessingGameRepository).clear();
        await app.close();
        await DataSource.destroy();
    });

    async function makeApiRequest(user: User = requester): Promise<SupertestResponse<RandomlyChosenMeaningResponse[]>> {
        const { status, body } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/vocabularies/definitions/random-search`)
            .set('Authorization', `Bearer ${generateJwToken(user)}`);

        return {
            status,
            body,
        };
    }

    describe('Searching', () => {
        afterEach(async () => {
            await Promise.all([
                app.get(GuessingGameRepository).clear(),
                removeVocabularyAndRelationsByCohortId(cohort.id),
            ]);
        });

        it('SHOULD return 200 OK', async () => {
            // Arrange
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            // Act
            const { status, body } = await makeApiRequest(requester);

            // Assert
            expect(status).toBe(200);
            expect(getRandomWordMock).not.toHaveBeenCalled();
            const response = body as RandomlyChosenMeaningResponse[];
            expect(response).not.toHaveLength(0);
            expect(response).toStrictEqual([
                <RandomlyChosenMeaningResponse>{
                    word: vocabulary.word,
                    meaning: vocabulary.definitions[0].meaning,
                },
            ]);
        });

        it('SHOULD return 200 OK excluding previously sent definitions', async () => {
            // Arrange
            const previousVocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            await app.get(GuessingGameRepository).insert({
                userId: requester.id,
                definitionId: previousVocabulary.definitions[0].id,
                createdAt: makeItOlder(new Date(), MomentUnit.DAYS, 3),
                word: previousVocabulary.word,
                meaning: previousVocabulary.definitions[0].meaning,
            });

            // Act
            const { status, body } = await makeApiRequest(requester);

            // Assert
            expect(status).toBe(200);
            expect(getRandomWordMock).not.toHaveBeenCalled();
            const response = body as RandomlyChosenMeaningResponse[];
            expect(response).not.toHaveLength(0);
            expect(response).toStrictEqual([
                <RandomlyChosenMeaningResponse>{
                    word: vocabulary.word,
                    meaning: vocabulary.definitions[0].meaning,
                },
            ]);
        });

        it('SHOULD return 200 OK with definitions from today', async () => {
            // Arrange
            const getRandomlyChosenMeaningsMock = jest.spyOn(
                DefinitionRepository.prototype,
                'getRandomlyChosenMeanings',
            );
            const insertMultiplesMock = jest.spyOn(GuessingGameRepository.prototype, 'insertMultiples');
            const previousVocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            await app.get(GuessingGameRepository).insert({
                userId: requester.id,
                definitionId: previousVocabulary.definitions[0].id,
                createdAt: new Date(),
                word: previousVocabulary.word,
                meaning: previousVocabulary.definitions[0].meaning,
            });

            // Act
            const { status, body } = await makeApiRequest(requester);

            // Assert
            expect(status).toBe(200);
            expect(getRandomWordMock).not.toHaveBeenCalled();
            expect(getRandomlyChosenMeaningsMock).not.toHaveBeenCalled();
            expect(insertMultiplesMock).not.toHaveBeenCalled();
            const response = body as RandomlyChosenMeaningResponse[];
            expect(response).not.toHaveLength(0);
            expect(response).toStrictEqual([
                <RandomlyChosenMeaningResponse>{
                    word: previousVocabulary.word,
                    meaning: previousVocabulary.definitions[0].meaning,
                },
            ]);

            // Post-Assert
            getRandomlyChosenMeaningsMock.mockRestore();
            insertMultiplesMock.mockRestore();
        });
    });
});
