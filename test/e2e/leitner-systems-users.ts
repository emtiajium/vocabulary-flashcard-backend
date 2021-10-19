import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import Cohort from '@/user/domains/Cohort';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester, removeUserByUsername } from '@test/util/user-util';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import CohortService from '@/user/services/CohortService';
import {
    createVocabulary,
    getVocabularyWithDefinitions,
    removeVocabularyAndRelationsByCohortId,
} from '@test/util/vocabulary-util';
import { createItem, removeLeitnerBoxItems } from '@test/util/leitner-systems-util';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import getAppAPIPrefix from '@test/util/service-util';
import generateJwToken from '@test/util/auth-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';

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
        app = await bootstrap(AppModule);
        requester = await createApiRequester();
        const cohortName = 'Leitner Systems Automated Test';
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username]);
    });

    afterAll(async () => {
        await removeVocabularyAndRelationsByCohortId(cohort.id);
        await removeUserByUsername(requester.username);
        await removeCohortByName(cohort.name);
        await removeLeitnerBoxItems(requester.id);
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
