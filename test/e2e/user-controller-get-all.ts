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
import generateJwToken from '@test/util/auth-util';
import UserReport from '@/user/domains/UserReport';

describe('/v1/users/all', () => {
    let app: INestApplication;

    const username = 'example23@gibberish.com';

    let requester: User;

    beforeAll(async () => {
        app = await bootstrap(AppModule);

        requester = await app.get(UserService).createUser({
            username,
            firstname: 'John',
        } as User);
    });

    afterAll(async () => {
        await removeUserByUsername(username);
        await removeCohortByName(username);
        await app.close();
    });

    const makeApiRequest = async (): Promise<SupertestResponse<UserReport[]>> => {
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
            const users = body as UserReport[];
            expect(users).not.toHaveLength(0);
            users.forEach((user) => {
                expect(user.username).toBeDefined();
                expect(user.name).toBeDefined();
                expect(user.cohortName).toBeDefined();
            });
        });
    });
});
