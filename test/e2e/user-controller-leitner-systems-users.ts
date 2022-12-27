import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import Cohort from '@/user/domains/Cohort';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester } from '@test/util/user-util';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import { createItem } from '@test/util/leitner-systems-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import * as uuid from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import generateJwToken from '@test/util/auth-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';
import ReportRequest from '@/common/domains/ReportRequest';
import { ConfigService } from '@nestjs/config';

describe('GET /v1/users/using-leitner-systems', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    function getRequestPayload(secret?: string): ReportRequest {
        return {
            secret: secret || new ConfigService().get<string>('GENERATING_REPORT_SECRET'),
        };
    }

    async function makeApiRequest(secret?: string): Promise<SupertestResponse<LeitnerSystemsLoverUsersReport[]>> {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/users/using-leitner-systems`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send(getRequestPayload(secret));
        return {
            status,
            body,
        };
    }

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        cohort = await createCohort({ name: `Cohort _ ${uuid.v4()}`, usernames: [requester.username] } as Cohort);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
    });

    describe('API request', () => {
        it('SHOULD return 400 BAD REQUEST WHEN secret is invalid', async () => {
            const { status, body } = await makeApiRequest(`Invalid_Secret_${uuid.v4()}`);

            expect(status).toBe(400);
            expect((body as SupertestErrorResponse).message).toContain(`secret must be matched`);
        });

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
