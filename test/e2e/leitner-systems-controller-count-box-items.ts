import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import { createVocabulary, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import User from '@/user/domains/User';
import { createApiRequester } from '@test/util/user-util';
import CohortService from '@/user/services/CohortService';
import generateJwToken from '@test/util/auth-util';
import { createItem } from '@test/util/leitner-systems-util';
import LeitnerBoxType from '@/vocabulary/domains/LeitnerBoxType';

describe('GET /v1/leitner-systems/items/count/:box', () => {
    let app: INestApplication;

    let requester: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        const cohortName = `Cohort _ ${uuidV4()}`;
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username]);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
    });

    async function makeApiRequest(
        box: LeitnerBoxType,
        requestedUser: User = requester,
    ): Promise<SupertestResponse<void>> {
        const { status, text } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/leitner-systems/items/count/${box}`)
            .set('Authorization', `Bearer ${generateJwToken(requestedUser)}`);
        return {
            status,
            text,
        };
    }

    it('SHOULD return 200 OK', async () => {
        const vocabulary = await createVocabulary(getVocabularyWithDefinitions(), cohort.id);
        await createItem(requester.id, vocabulary.id, LeitnerBoxType.BOX_1);

        const { status, text } = await makeApiRequest(LeitnerBoxType.BOX_1);

        expect(status).toBe(200);
        expect(text).toBe('1');
    });

    it('SHOULD return 200 OK II', async () => {
        const { status, text } = await makeApiRequest(LeitnerBoxType.BOX_2);

        expect(status).toBe(200);
        expect(text).toBe('0');
    });
});
