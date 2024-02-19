import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Vocabulary from '@/vocabulary/domains/Vocabulary';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester } from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import { capitalize } from 'lodash';
import { plainToClass } from 'class-transformer';
import DataSource from '@/common/persistence/TypeormConfig';

describe('/v1/vocabularies/:id/assert-existence/words/:word', () => {
    let app: INestApplication;

    let requester: User;

    const cohortIds: string[] = [];

    type ApiResponse = Partial<Vocabulary>;

    async function seed(): Promise<{ user: User; cohort: Cohort }> {
        let user = await createApiRequester();
        const cohort = await createCohort({ name: `Cohort _ ${uuid.v4()}`, usernames: [user.username] } as Cohort);
        cohortIds.push(cohort.id);
        user.cohort = cohort;
        user.cohortId = cohort.id;
        user = plainToClass(User, user);
        return {
            user,
            cohort,
        };
    }

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
        const response = await seed();
        requester = response.user;
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds(cohortIds);
        await app.close();
        await DataSource.destroy();
    });

    function makeApiRequest(id: string, word: string): Promise<SupertestResponse<ApiResponse>> {
        return request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/vocabularies/${id}/assert-existence/words/${word}`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`);
    }

    it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
        // Act
        const { status } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/vocabularies/${uuid.v4()}/assert-existence/words/hello`)
            .send();

        // Assert
        expect(status).toBe(403);
    });

    describe('API call before creating vocabulary by the end-user', () => {
        it('SHOULD return 200 OK WITH vocabulary WHEN the vocabulary with requested word exists: Case Insensitive I | CREATE', async () => {
            // Arrange
            const vocabularyId = uuid.v4();
            const word = 'Hello, hello';
            const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, word.toLowerCase());

            // Assert
            expect(status).toBe(200);
            expect(body as ApiResponse).toStrictEqual({
                id: vocabulary.id,
                word: vocabulary.word,
            });
        });

        it('SHOULD return 200 OK WITH vocabulary WHEN the vocabulary with requested word exists: Case Insensitive II | CREATE', async () => {
            // Arrange
            const vocabularyId = uuid.v4();
            const word = 'blah, Blah';
            const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, word.toUpperCase());

            // Assert
            expect(status).toBe(200);
            expect(body as ApiResponse).toStrictEqual({
                id: vocabulary.id,
                word: capitalize(vocabulary.word),
            });
        });

        it('SHOULD return 200 OK WITHOUT vocabulary WHEN the exact word does not exist | CREATE', async () => {
            // Arrange
            const vocabularyId = uuid.v4();
            const word = 'Dhaka, Bangladesh';
            await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, 'Bangladesh');

            // Assert
            expect(status).toBe(200);
            expect(body as ApiResponse).toStrictEqual({});
        });

        it('SHOULD return 200 OK WITHOUT vocabulary WHEN the vocabulary with requested word exists in a different cohort | CREATE', async () => {
            // Arrange
            const vocabularyId = uuid.v4();
            const { cohort } = await seed();
            const newCohortId = cohort.id;
            const { word } = await createVocabulary(getVocabularyWithDefinitions(), newCohortId);

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, word);

            // Assert
            expect(status).toBe(200);
            expect(body).toStrictEqual({});
        });
    });

    describe('API call after creating vocabulary by the end-user | word already exist', () => {
        it('SHOULD return 200 OK WITH vocabulary WHEN the vocabulary with requested word exists | UPDATE', async () => {
            // Arrange
            // user tries to change the word while updating an existing vocab
            const word = 'Chattogram, Bangladesh';
            const [vocabulary, vocabulary2] = await Promise.all([
                createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId),
                createVocabulary(getVocabularyWithDefinitions(), requester.cohortId),
            ]);
            const vocabularyId = vocabulary2.id;

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, word.toLowerCase());

            // Assert
            expect(status).toBe(200);
            expect(body as ApiResponse).toStrictEqual({
                id: vocabulary.id,
                word: capitalize(vocabulary.word),
            });
        });

        it('SHOULD return 200 OK WITHOUT vocabulary WHEN the vocabulary with requested word exists but with requested vocab (ID): Case Insensitive I', async () => {
            // Arrange
            const word = 'Barishal, bangladesh';
            const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);
            const vocabularyId = vocabulary.id;

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, word.toLowerCase());

            // Assert
            expect(status).toBe(200);
            expect(body as ApiResponse).toStrictEqual({});
        });

        it('SHOULD return 200 OK WITHOUT vocabulary WHEN the vocabulary with requested word exists but with requested vocab (ID): Case Insensitive II', async () => {
            // Arrange
            const word = 'sylhet, Bangladesh';
            const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);
            const vocabularyId = vocabulary.id;

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, word.toUpperCase());

            // Assert
            expect(status).toBe(200);
            expect(body as ApiResponse).toStrictEqual({});
        });

        it('SHOULD return 200 OK WITHOUT vocabulary WHEN the exact word does not exist | UPDATE', async () => {
            // Arrange
            const word = 'Cumilla, Bangladesh';
            const vocabulary = await createVocabulary({ ...getVocabularyWithDefinitions(), word }, requester.cohortId);
            const vocabularyId = vocabulary.id;

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, 'Bangladesh');

            // Assert
            expect(status).toBe(200);
            expect(body as ApiResponse).toStrictEqual({});
        });

        it('SHOULD return 200 OK WITHOUT vocabulary WHEN the vocabulary with requested word exists in a different cohort | UPDATE', async () => {
            // Arrange
            const { cohort } = await seed();
            const newCohortId = cohort.id;
            const { word, id: vocabularyId } = await createVocabulary(getVocabularyWithDefinitions(), newCohortId);

            // Act
            const { status, body } = await makeApiRequest(vocabularyId, word);

            // Assert
            expect(status).toBe(200);
            expect(body).toStrictEqual({});
        });
    });
});
