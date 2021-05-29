import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import bootstrap from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { ObjectLiteral } from '@/common/ObjectLiteral';
import getUserByUsername, { removeUserByUsername } from '@test/util/user-util';

describe('/v1/users', () => {
    let app: INestApplication;

    const getBasePayload = (): ObjectLiteral => {
        return {
            username: 'example@gibberish.com',
            firstname: 'John',
            lastname: 'Doe',
            profilePictureUrl: 'https://gibberish.com/files/images/blah.png',
        };
    };

    beforeAll(async () => {
        app = await bootstrap(AppModule);
    });

    afterAll(async () => {
        await removeUserByUsername(getBasePayload().username);
        await app.close();
    });

    const makeApiRequest = async (user?: ObjectLiteral): Promise<ObjectLiteral> => {
        const { status, body } = await request(app.getHttpServer()).post(`${getAppAPIPrefix()}/v1/users`).send(user);
        return {
            status,
            body,
        };
    };

    describe('POST /', () => {
        describe('Bad Payload', () => {
            it('SHOULD return 400 BAD_REQUEST for empty payload', async () => {
                const { status } = await makeApiRequest();
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without username', async () => {
                const user = { ...getBasePayload() };
                delete user.username;
                const { status } = await makeApiRequest(user);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without firstname', async () => {
                const user = { ...getBasePayload() };
                delete user.firstname;
                const { status } = await makeApiRequest(user);
                expect(status).toBe(400);
            });
        });

        describe('Success', () => {
            beforeEach(() => async () => {
                await removeUserByUsername(getBasePayload().username);
            });

            it('SHOULD return 201 CREATED for payload with id', async () => {
                const user = { ...getBasePayload() };
                const { status } = await makeApiRequest(user);
                expect(status).toBe(201);
                const createdUser = await getUserByUsername(user.username);
                expect(createdUser.username).toBe(user.username);
            });

            it('SHOULD ignore multiple creation requests with same ID', async () => {
                const user = { ...getBasePayload() };
                const { status: status1 } = await makeApiRequest(user);
                expect(status1).toBe(201);
                const { status: status2 } = await makeApiRequest(user);
                expect(status2).toBe(201);
                const createdUser = await getUserByUsername(user.username);
                expect(createdUser.username).toBe(user.username);
            });
        });
    });
});
