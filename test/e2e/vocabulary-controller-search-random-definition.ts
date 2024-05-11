import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester } from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import DataSource from '@/common/persistence/TypeormConfig';
import { RandomlyChosenMeaningResponse } from '@/vocabulary/domains/RandomlyChosenMeaningResponse';

describe('GET /v1/vocabularies/definitions/random-search', () => {
    let app: INestApplication;

    let requester: User;
    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
        requester = await createApiRequester();
        cohort = await createCohort({
            name: `Cohort _ ${uuid.v4()}`,
            usernames: [requester.username],
        } as Cohort);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
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
        it('SHOULD return 200 OK', async () => {
            // Arrange
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);

            // Act
            const { status, body } = await makeApiRequest(requester);

            // Assert
            expect(status).toBe(200);
            const response = body as RandomlyChosenMeaningResponse[];
            expect(response).not.toHaveLength(0);
            expect(response).toStrictEqual([
                <RandomlyChosenMeaningResponse>{
                    word: vocabulary.word,
                    meaning: vocabulary.definitions[0].meaning,
                },
            ]);
        });
    });
});
