import { INestApplication } from '@nestjs/common';
import User from '@/user/domains/User';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { createApiRequester, removeUsersByUsernames } from '@test/util/user-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import * as request from 'supertest';
import getAppAPIPrefix from '@test/util/service-util';
import Android from '@/android/domains/Android';
import { v4 as uuidV4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { getRepository } from 'typeorm';

describe('/v1/androids', () => {
    let app: INestApplication;

    let requester: User;

    const versionName = `Android Version Name for Automated Tests`;

    async function removeAndroid(): Promise<void> {
        await getRepository(Android).delete({ versionName });
    }

    function getAndroid(): Promise<Android[]> {
        return getRepository(Android).find({ versionName });
    }

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
    });

    afterAll(async () => {
        await removeUsersByUsernames([requester.username]);
        await app.close();
    });

    describe('POST', () => {
        async function makeApiRequest(android: Android): Promise<SupertestResponse<Android>> {
            const { status, body } = await request(app.getHttpServer())
                .post(`${getAppAPIPrefix()}/v1/androids`)
                .send(android);
            return {
                status,
                body,
            };
        }

        afterEach(async () => {
            await removeAndroid();
        });

        it('SHOULD return 400 BAD REQUEST WHEN secret does not match', async () => {
            const { status, body } = await makeApiRequest({
                versionCode: 1,
                versionName,
                secret: uuidV4(),
            });

            expect(status).toBe(400);
            expect((body as SupertestErrorResponse).message).toContain(`secret must be matched`);
        });

        it('SHOULD return 201 CREATED for a brand new request', async () => {
            const payload: Android = {
                versionCode: 1,
                versionName,
                secret: new ConfigService().get('ANDROID_VERSION_UPDATE_SECRET'),
            };
            const { status, body } = await makeApiRequest(payload);
            expect(status).toBe(201);
            const android = body as Android;
            expect(android.versionName).toBe(payload.versionName);
            expect(android.versionCode).toBe(payload.versionCode);
            expect(android.secret).toBeUndefined();
        });

        it('SHOULD return 201 CREATED for another request', async () => {
            const payload: Android = {
                versionCode: 1,
                versionName,
                secret: new ConfigService().get('ANDROID_VERSION_UPDATE_SECRET'),
            };
            await makeApiRequest(payload);
            const { status, body } = await makeApiRequest({ ...payload, versionCode: 2 });
            expect(status).toBe(201);
            const android = body as Android;
            expect(android.versionName).toBe(payload.versionName);
            expect(android.versionCode).toBe(2);
            expect(android.secret).toBeUndefined();
            expect((await getAndroid()).length).toBe(1);
        });
    });

    describe('GET', () => {
        async function makeApiRequest(): Promise<SupertestResponse<Android>> {
            const { status, body } = await request(app.getHttpServer()).get(`${getAppAPIPrefix()}/v1/androids`).send();
            return {
                status,
                body,
            };
        }

        afterEach(async () => {
            await removeAndroid();
        });

        it('SHOULD return 200 OK with response', async () => {
            await getRepository(Android).save({
                versionCode: 1,
                versionName,
            });
            const { status, body } = await makeApiRequest();
            expect(status).toBe(200);
            const android = body as Android;
            expect(android.id).toBeDefined();
            expect(android.versionCode).toBe(1);
            expect(android.versionName).toBe(versionName);
            expect(android.secret).toBeUndefined();
        });
    });
});
