import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { kickOff } from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import getUserByUsername, { createApiRequester, generateUsername } from '@test/util/user-util';
import User from '@/user/domains/User';
import SupertestResponse from '@test/util/supertest-util';
import getCohortByName, {
    addUsersToCohort,
    createCohort,
    removeCohortsWithRelationsByIds,
} from '@test/util/cohort-util';
import generateJwToken from '@test/util/auth-util';
import {
    createVocabulary,
    getDefinitionsByVocabularyId,
    getVocabularyById,
    getVocabularyWithDefinitions,
} from '@test/util/vocabulary-util';
import Cohort from '@/user/domains/Cohort';
import { createItem, getLeitnerBoxItem } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import CacheUserService from '@/user/services/CacheUserService';
import DataSource from '@/common/persistence/TypeormConfig';
import GuessingGameRepository from '@/vocabulary/repositories/GuessingGameRepository';
import * as uuid from 'uuid';

describe('DELETE /v1/users/self', () => {
    let app: INestApplication;

    const usernames = [generateUsername(), generateUsername()];
    let cohortIds: string[] = [];

    let requester: User;
    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds(cohortIds);
        await app.close();
        await DataSource.destroy();
    });

    async function makeApiRequest(): Promise<SupertestResponse<void>> {
        const { status, body } = await request(app.getHttpServer())
            .delete(`${getAppAPIPrefix()}/v1/users/self`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`);
        return {
            status,
            body,
        };
    }

    async function prepareInitialData(): Promise<void> {
        requester = await createApiRequester(usernames[0]);
        cohort = await createCohort({ name: usernames[0], usernames: [usernames[0]] });
        cohortIds.push(cohort.id);
    }

    async function removeData(): Promise<void> {
        await removeCohortsWithRelationsByIds(cohortIds);
        cohortIds = [];
    }

    describe('Authentication', () => {
        it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
            // Act
            const { status } = await request(app.getHttpServer()).delete(`${getAppAPIPrefix()}/v1/users/self`);

            // Arrange
            expect(status).toBe(403);
        });
    });

    describe('Definition Deletion', () => {
        beforeEach(async () => {
            await prepareInitialData();
        });

        afterEach(async () => {
            await removeData();
        });

        it('SHOULD delete definition WHEN the cohort of the user does not have any other member', async () => {
            // Arrange
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            const definitions = await getDefinitionsByVocabularyId(vocabulary.id);
            expect(definitions).toHaveLength(0);
        });

        it('SHOULD NOT delete definition WHEN the cohort of the user has other member', async () => {
            // Arrange
            await createApiRequester(usernames[1]);
            await addUsersToCohort(cohort.name, usernames);
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            const definitions = await getDefinitionsByVocabularyId(vocabulary.id);
            expect(definitions).not.toHaveLength(0);
        });
    });

    describe('Vocabulary Deletion', () => {
        beforeEach(async () => {
            await prepareInitialData();
        });

        afterEach(async () => {
            await removeData();
        });

        it('SHOULD delete vocabulary WHEN the cohort of the user does not have any other member', async () => {
            // Arrange
            let vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            vocabulary = await getVocabularyById(vocabulary.id);
            expect(vocabulary).toBeNull();
        });

        it('SHOULD NOT delete vocabulary WHEN the cohort of the user has other member', async () => {
            // Arrange
            await createApiRequester(usernames[1]);
            await addUsersToCohort(cohort.name, usernames);
            let vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            vocabulary = await getVocabularyById(vocabulary.id);
            expect(vocabulary).toMatchObject({
                cohortId: cohort.id,
            });
        });
    });

    describe('Flashcard Deletion', () => {
        beforeEach(async () => {
            await prepareInitialData();
        });

        afterEach(async () => {
            await removeData();
        });

        it('SHOULD delete flashcard WHEN the cohort of the user does not have any other member', async () => {
            // Arrange
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            expect(await getLeitnerBoxItem(requester.id, vocabulary.id)).toBeNull();
        });

        it('SHOULD delete flashcard WHEN the cohort of the user has other member', async () => {
            // Arrange
            await createApiRequester(usernames[1]);
            await addUsersToCohort(cohort.name, usernames);
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            expect(await getLeitnerBoxItem(requester.id, vocabulary.id)).toBeNull();
        });
    });

    describe('User Deletion', () => {
        beforeEach(async () => {
            await prepareInitialData();
        });

        afterEach(async () => {
            await removeData();
        });

        it('SHOULD delete user WHEN the cohort of the user does not have any other member', async () => {
            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            expect(await getUserByUsername(requester.username)).toBeNull();
        });

        it('SHOULD delete user WHEN the cohort of the user has other member', async () => {
            // Arrange
            await createApiRequester(usernames[1]);
            await addUsersToCohort(cohort.name, usernames);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            expect(await getUserByUsername(requester.username)).toBeNull();
            expect(await getUserByUsername(usernames[1])).toMatchObject({
                cohortId: cohortIds[0],
            });
        });

        it('SHOULD delete user from cache', async () => {
            // Arrange
            app.get(CacheUserService).set({ ...requester, cohortId: cohort.id } as User);

            // Act
            await makeApiRequest();

            // Assert
            expect(app.get(CacheUserService).get(requester.username)).toBeUndefined();
        });
    });

    describe('Cohort Deletion', () => {
        beforeEach(async () => {
            await prepareInitialData();
        });

        afterEach(async () => {
            await removeData();
        });

        it('SHOULD delete cohort WHEN the cohort of the user does not have any other member', async () => {
            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            expect(await getCohortByName(cohort.name)).toBeNull();
        });

        it('SHOULD NOT delete cohort WHEN the cohort of the user has other member', async () => {
            // Arrange
            await createApiRequester(usernames[1]);
            await addUsersToCohort(cohort.name, usernames);

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            expect(await getCohortByName(cohort.name)).toMatchObject({
                id: cohort.id,
            });
        });
    });

    describe('Guessing Game Item Deletion', () => {
        beforeEach(async () => {
            await prepareInitialData();
        });

        afterEach(async () => {
            await removeData();
        });

        it('SHOULD delete guessing game items', async () => {
            // Arrange
            await app.get(GuessingGameRepository).insert({
                userId: requester.id,
                definitionId: uuid.v4(),
            });

            // Act
            const { status } = await makeApiRequest();

            // Assert
            expect(status).toBe(200);
            expect(await app.get(GuessingGameRepository).findOneBy({ userId: requester.id })).toBeNull();
        });
    });
});
