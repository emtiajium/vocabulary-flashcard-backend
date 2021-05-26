import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import bootstrap from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';

describe('/v1/users', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await bootstrap(AppModule);
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
