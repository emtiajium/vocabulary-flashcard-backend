import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import bootstrap from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import { createUser, removeUserByUsername } from '@test/util/user-util';
import User from '@/user/domains/User';

describe('/v1/users', () => {
    let app: INestApplication;

    const username = 'example20@gibberish.com';

    beforeAll(async () => {
        app = await bootstrap(AppModule);
        await removeUserByUsername(username);
    });

    afterAll(async () => {
        await removeUserByUsername(username);
        await app.close();
    });

    const makeApiRequest = async (): Promise<ObjectLiteral> => {
        const { status, body } = await request(app.getHttpServer()).get(`${getAppAPIPrefix()}/v1/users/${username}`);
        return {
            status,
            body,
        };
    };

    describe('GET /:username', () => {
        beforeAll(async () => {
            await createUser({
                username,
                firstname: 'John',
            } as User);
        });

        it('SHOULD return 200 OK with user details', async () => {
            const { body: user } = await makeApiRequest();
            expect(user).toBeDefined();
            expect(user.username).toBe(username);
        });
    });
});
