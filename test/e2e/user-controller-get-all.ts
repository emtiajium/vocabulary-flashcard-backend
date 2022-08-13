import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { kickOff } from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { removeUsersByUsernames } from '@test/util/user-util';
import User from '@/user/domains/User';
import UserService from '@/user/services/UserService';
import SupertestResponse from '@test/util/supertest-util';
import { removeCohortsByNames } from '@test/util/cohort-util';
import generateJwToken from '@test/util/auth-util';
import UserReport from '@/user/domains/UserReport';
import SearchResult from '@/common/domains/SearchResult';
import * as uuid from 'uuid';

describe('/v1/users/all', () => {
    let app: INestApplication;

    const usernames = [`example_${uuid.v4()}@gibberish.com`, `example_${uuid.v4()}@gibberish.com`];

    let requester: User;

    beforeAll(async () => {
        app = await kickOff(AppModule);

        requester = await app.get(UserService).createUser({
            username: usernames[0],
            firstname: 'John',
        } as User);
    });

    afterAll(async () => {
        await removeUsersByUsernames(usernames);
        await removeCohortsByNames(usernames);
        await app.close();
    });

    const makeApiRequest = async (): Promise<SupertestResponse<SearchResult<UserReport>>> => {
        const { status, body } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/users/all`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`);
        return {
            status,
            body,
        };
    };

    describe('Request', () => {
        it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
            const { status } = await request(app.getHttpServer()).get(`${getAppAPIPrefix()}/v1/users/all`);
            expect(status).toBe(403);
        });

        it('SHOULD return 200 OK with users', async () => {
            const { body } = await makeApiRequest();
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
            const anotherUser = await app.get(UserService).createUser({
                username: usernames[1],
                firstname: 'John',
            } as User);
            const { body } = await makeApiRequest();
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
