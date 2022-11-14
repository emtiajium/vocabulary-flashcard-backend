import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { kickOff } from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { createApiRequester, generateUsername, removeUsersByUsernames } from '@test/util/user-util';
import User from '@/user/domains/User';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import { createCohort, removeCohortsByNames } from '@test/util/cohort-util';
import generateJwToken from '@test/util/auth-util';
import UserReport from '@/user/domains/UserReport';
import SearchResult from '@/common/domains/SearchResult';
import ReportRequest from '@/common/domains/ReportRequest';
import { ConfigService } from '@nestjs/config';
import * as uuid from 'uuid';

describe('/v1/users/all', () => {
    let app: INestApplication;

    const usernames = [generateUsername(), generateUsername()];

    let requester: User;

    beforeAll(async () => {
        app = await kickOff(AppModule);

        requester = await createApiRequester(usernames[0]);
        await createCohort({ name: usernames[0], usernames: [usernames[0]] });
    });

    afterAll(async () => {
        await removeUsersByUsernames(usernames);
        await removeCohortsByNames(usernames);
        await app.close();
    });

    function getRequestPayload(secret?: string): ReportRequest {
        return {
            secret: secret || new ConfigService().get<string>('GENERATING_REPORT_SECRET'),
        };
    }

    const makeApiRequest = async (secret?: string): Promise<SupertestResponse<SearchResult<UserReport>>> => {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/users/all`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send(getRequestPayload(secret));
        return {
            status,
            body,
        };
    };

    describe('Request', () => {
        it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
            const { status } = await request(app.getHttpServer())
                .post(`${getAppAPIPrefix()}/v1/users/all`)
                .send(getRequestPayload());
            expect(status).toBe(403);
        });

        it('SHOULD return 403 FORBIDDEN WHEN secret is invalid', async () => {
            const { status, body } = await makeApiRequest(`Invalid_Secret_${uuid.v4()}`);

            expect(status).toBe(403);
            expect((body as SupertestErrorResponse).message).toBe(`Forbidden`);
        });

        it('SHOULD return 200 OK with users', async () => {
            const { status, body } = await makeApiRequest();

            expect(status).toBe(200);
            const response = body as SearchResult<UserReport>;
            expect(response.results).not.toHaveLength(0);
            expect(response.total).not.toBe(0);
            response.results.forEach((user) => {
                expect(user.username).toBeDefined();
                expect(user.name).toBeDefined();
                expect(user.createdAt).toBeDefined();
                expect(user.cohort.name).toBeDefined();
            });
        });

        it('SHOULD return 200 OK with users ordered by creation time', async () => {
            const anotherUser = await createApiRequester(usernames[1]);
            await createCohort({ name: usernames[1], usernames: [usernames[1]] });

            const { body, status } = await makeApiRequest();

            expect(status).toBe(200);
            const response = body as SearchResult<UserReport>;
            const mostRecentUser = response.results[response.total - 1];
            expect(mostRecentUser).toMatchObject({
                username: anotherUser.username,
                cohort: {
                    name: anotherUser.username,
                },
            });
        });
    });
});
