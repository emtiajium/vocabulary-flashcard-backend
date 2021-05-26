import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import bootstrap from '@/bootstrap';
import UserModule from '@/user/UserModule';
import getAppAPIPrefix from '@test/util/service-util';

describe('/v1/users', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await bootstrap(UserModule);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /', () => {
        it('SHOULD return 200 OK', async () => {
            await request(app.getHttpServer())
                .get(`${getAppAPIPrefix()}/v1/users`)
                .expect(200)
                .expect((response) => {
                    expect(response.body).toBeDefined();
                });
        });
    });
});
