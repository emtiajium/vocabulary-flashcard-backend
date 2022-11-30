import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester } from '@test/util/user-util';
import CohortService from '@/user/services/CohortService';
import generateJwToken from '@test/util/auth-util';
import { plainToClass } from 'class-transformer';

describe('/v1/vocabularies/words/:word', () => {
    let app: INestApplication;

    let requester: User;

    const cohortIds: string[] = [];

    type ApiResponse = Vocabulary;

    async function seed(): Promise<{ user: User; cohort: Cohort }> {
        let user = await createApiRequester();
        const cohort = await createCohort({ name: `Cohort _ ${uuid.v4()}`, usernames: [] } as Cohort);
        cohortIds.push(cohort.id);
        await app.get(CohortService).addUsersToCohort(cohort.name, [user.username]);
        user.cohort = cohort;
        user = plainToClass(User, user);
        return {
            user,
            cohort,
        };
    }

    beforeAll(async () => {
        app = await kickOff(AppModule);
        const response = await seed();
        requester = response.user;
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds(cohortIds);
        await app.close();
    });

    function makeApiRequest(word: string): Promise<SupertestResponse<ApiResponse>> {
        return request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/vocabularies/words/${word}`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`);
    }

    it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
        // Act
        const { status } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/vocabularies/words/hello`)
            .send();

        // Assert
        expect(status).toBe(403);
    });

    it('SHOULD return 200 OK WITH vocabulary WHEN the vocabulary with requested word exists: Case Insensitive I', async () => {
        // Arrange
        const word = 'Hello, hello';
        const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);

        // Act
        const { status, body } = await makeApiRequest(word.toLowerCase());

        // Assert
        expect(status).toBe(200);
        expect(body as ApiResponse).toMatchObject({
            id: vocabulary.id,
            word: vocabulary.word,
        });
    });

    it('SHOULD return 200 OK WITH vocabulary WHEN the vocabulary with requested word exists: Case Insensitive II', async () => {
        // Arrange
        const word = 'blah, Blah';
        const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);

        // Act
        const { status, body } = await makeApiRequest(word.toUpperCase());

        // Assert
        expect(status).toBe(200);
        expect(body as ApiResponse).toMatchObject({
            id: vocabulary.id,
            word: vocabulary.word,
        });
    });

    it('SHOULD return 404 NOT FOUND WITHOUT vocabulary WHEN the exact word does not exist', async () => {
        // Arrange
        const word = 'Dhaka, Bangladesh';
        await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);

        // Act
        const { status, body } = await makeApiRequest('Bangladesh');

        // Assert
        expect(status).toBe(404);
        expect((body as SupertestErrorResponse).message).toBe(`Vocabulary with word "Bangladesh" does not exist`);
    });

    it('SHOULD return 404 NOT FOUND WITHOUT vocabulary WHEN the vocabulary with requested word exists in a different cohort', async () => {
        // Arrange
        const { cohort } = await seed();
        const newCohortId = cohort.id;
        const { word } = await createVocabulary(getVocabularyWithDefinitions(), newCohortId);

        // Act
        const { status, body } = await makeApiRequest(word);

        // Assert
        expect(status).toBe(404);
        expect((body as SupertestErrorResponse).message).toBe(`Vocabulary with word "${word}" does not exist`);
    });
});
