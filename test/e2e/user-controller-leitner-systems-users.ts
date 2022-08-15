import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import Cohort from '@/user/domains/Cohort';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester } from '@test/util/user-util';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import CohortService from '@/user/services/CohortService';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import { createItem } from '@test/util/leitner-systems-util';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import generateJwToken from '@test/util/auth-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';

describe('GET /v1/users/using-leitner-systems', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    async function makeApiRequest(): Promise<SupertestResponse<LeitnerSystemsLoverUsersReport[]>> {
        const { status, body } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/users/using-leitner-systems`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send();
        return {
            status,
            body,
        };
    }

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        cohort = await createCohort({ name: `Cohort _ ${uuid.v4()}`, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohort.name, [requester.username]);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
    });

    describe('API request', () => {
        it('SHOULD return 200 OK', async () => {
            const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
            await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

            const { status, body } = await makeApiRequest();

            expect(status).toBe(200);
            const leitnerSystemsLoverUsersReports = body as LeitnerSystemsLoverUsersReport[];
            expect(leitnerSystemsLoverUsersReports).not.toHaveLength(0);
            expect(
                leitnerSystemsLoverUsersReports.find((report) => report.username === requester.username),
            ).toMatchObject({
                vocabCount: 1,
            });
        });
    });
});
