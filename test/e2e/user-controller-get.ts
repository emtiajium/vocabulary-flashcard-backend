import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import bootstrap from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { removeUserByUsername } from '@test/util/user-util';
import User from '@/user/domains/User';
import UserService from '@/user/services/UserService';
import SupertestResponse from '@test/util/supertest-util';
import { removeCohortByName } from '@test/util/cohort-util';

describe('/v1/users', () => {
    let app: INestApplication;

    const username = 'example20@gibberish.com';

    beforeAll(async () => {
        app = await bootstrap(AppModule);
        await removeUserByUsername(username);
    });

    afterAll(async () => {
        await removeUserByUsername(username);
        await removeCohortByName(username);
        await app.close();
    });

    const makeApiRequest = async (id: string): Promise<SupertestResponse<User>> => {
        const { status, body } = await request(app.getHttpServer())
            .get(`${getAppAPIPrefix()}/v1/users/self`)
            .set('X-User-Id', id);
        return {
            status,
            body,
        };
    };

    describe('GET /self', () => {
        let requester: User;

        beforeAll(async () => {
            requester = await app.get(UserService).createUser({
                username,
                firstname: 'John',
            } as User);
        });

        it('SHOULD return 403 FORBIDDEN WHEN request header X-User-Id is missing', async () => {
            const { status } = await request(app.getHttpServer()).get(`${getAppAPIPrefix()}/v1/users/self`);
            expect(status).toBe(403);
        });

        it('SHOULD return 200 OK with user details', async () => {
            const { body } = await makeApiRequest(requester.id);
            const user = body as User;
            expect(user).toBeDefined();
            expect(user.username).toBe(username);
            expect(user.cohort).toMatchObject({ name: user.username });
        });
    });
});
