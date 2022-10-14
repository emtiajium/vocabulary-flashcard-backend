import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import SupertestResponse from '@test/util/supertest-util';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import User from '@/user/domains/User';
import { createApiRequester, createUser } from '@test/util/user-util';
import CohortService from '@/user/services/CohortService';
import generateJwToken from '@test/util/auth-util';

describe('GET /v1/cohorts/self', () => {
    let app: INestApplication;

    let requester: User;
    let secondUser: User;

    let cohort: Cohort;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
        secondUser = await createUser({
            username: `friend_${uuidV4()}@firecrackervocabulary.com`,
            firstname: 'Friend',
        } as User);
        const cohortName = `Cohort _ ${uuidV4()}`;
        cohort = await createCohort({ name: cohortName, usernames: [] } as Cohort);
        await app.get(CohortService).addUsersToCohort(cohortName, [requester.username, secondUser.username]);
    });

    afterAll(async () => {
        await removeCohortsWithRelationsByIds([cohort.id]);
        await app.close();
    });

    async function makeApiRequest(requestedUser: User = requester): Promise<SupertestResponse<Cohort>> {
        const { status, body } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/cohorts/self`)
            .set('Authorization', `Bearer ${generateJwToken(requestedUser)}`)
            .send();
        return {
            status,
            body,
        };
    }

    it('SHOULD return 200 OK WITH cohort and members', async () => {
        const { status, body } = await makeApiRequest();

        expect(status).toBe(200);
        expect(body as Cohort).toStrictEqual({
            name: cohort.name,
            users: [
                expect.objectContaining({
                    firstname: secondUser.firstname,
                    lastname: secondUser.lastname,
                    name: secondUser.firstname,
                    profilePictureUrl: secondUser.profilePictureUrl,
                    username: secondUser.username,
                }),
                expect.objectContaining({
                    firstname: requester.firstname,
                    lastname: requester.lastname,
                    name: requester.firstname,
                    profilePictureUrl: requester.profilePictureUrl,
                    username: requester.username,
                }),
            ],
        });
    });
});
