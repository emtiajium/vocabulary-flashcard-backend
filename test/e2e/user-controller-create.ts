import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import bootstrap from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import getUserByUsername, { removeUserByUsername } from '@test/util/user-util';
import getCohortByName from '@test/util/cohort-util';
import User from '@/user/domains/User';
import SupertestResponse from '@test/util/supertest-util';

describe('/v1/users', () => {
    let app: INestApplication;

    const getBasePayload = (): User =>
        ({
            username: 'example30@gibberish.com',
            firstname: 'John',
            lastname: 'Doe',
            profilePictureUrl: 'https://gibberish.com/files/images/blah.png',
        } as User);

    beforeAll(async () => {
        app = await bootstrap(AppModule);
    });

    afterAll(async () => {
        await removeUserByUsername(getBasePayload().username);
        await app.close();
    });

    const makeApiRequest = async (user?: User): Promise<SupertestResponse<User>> => {
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
                const { status } = await makeApiRequest(user as User);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without firstname', async () => {
                const user = { ...getBasePayload() };
                delete user.firstname;
                const { status } = await makeApiRequest(user as User);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with invalid profilePictureUrl', async () => {
                const user = { ...getBasePayload(), profilePictureUrl: `NOT_A_URL` };
                const { status } = await makeApiRequest(user as User);
                expect(status).toBe(400);
            });
        });

        describe('Success', () => {
            beforeEach(() => async () => {
                await removeUserByUsername(getBasePayload().username);
            });

            it('SHOULD return 201 CREATED for payload without lastname', async () => {
                const user = { ...getBasePayload() };
                delete user.lastname;
                const { status, body: createdUser } = await makeApiRequest(user as User);
                expect(status).toBe(201);
                expect((createdUser as User).name).toBe(user.firstname);
            });

            it('SHOULD return 201 CREATED for payload without profilePictureUrl', async () => {
                const user = { ...getBasePayload() };
                delete user.profilePictureUrl;
                const { status } = await makeApiRequest(user as User);
                expect(status).toBe(201);
            });

            it('SHOULD return 201 CREATED for payload without id', async () => {
                const user = { ...getBasePayload() };
                const { status, body } = await makeApiRequest(user as User);
                expect(status).toBe(201);
                const createdUser = body as User;
                expect(createdUser.username).toBe(user.username);
                expect(createdUser.id).toBeDefined();
            });

            it('SHOULD return 201 CREATED for payload with id and the passed ID will be ignored', async () => {
                const user = { ...getBasePayload(), id: uuidV4 } as ObjectLiteral;
                const { status, body } = await makeApiRequest(user as User);
                expect(status).toBe(201);

                const createdUser = await getUserByUsername(user.username);
                expect(createdUser.username).toBe(user.username);
                expect(createdUser.id).toBe((body as User).id);
                expect(createdUser.id).not.toBe(user.id);
            });

            it('SHOULD ignore multiple creation requests with same ID', async () => {
                const user = { ...getBasePayload() } as User;
                const { status: status1, body } = await makeApiRequest(user);
                expect(status1).toBe(201);
                const createdUserFirstTime = body as User;
                expect(createdUserFirstTime.username).toBe(user.username);

                const { status: status2, body: createdUserSecondTime } = await makeApiRequest(user);
                expect(status2).toBe(201);
                expect(createdUserFirstTime.id).toBe((createdUserSecondTime as User).id);
            });

            it('SHOULD update the user', async () => {
                const user = { ...getBasePayload() } as User;
                const { status: status1, body } = await makeApiRequest(user);
                expect(status1).toBe(201);
                const createdUserFirstTime = body as User;
                expect(createdUserFirstTime.username).toBe(user.username);

                const { status: status2, body: body2 } = await makeApiRequest({
                    ...user,
                    firstname: 'Modified',
                } as User);
                expect(status2).toBe(201);
                const createdUserSecondTime = body2 as User;
                expect(createdUserFirstTime.id).toBe(createdUserSecondTime.id);
                expect(createdUserSecondTime.firstname).toBe('Modified');
                expect(new Date(createdUserSecondTime.updatedAt).getTime()).not.toBe(
                    new Date(createdUserFirstTime.updatedAt).getTime(),
                );
                expect(createdUserSecondTime.version).toBe(createdUserFirstTime.version + 1);
            });

            it('SHOULD return 201 CREATED with cohortId', async () => {
                const user = { ...getBasePayload() } as User;
                const { status, body } = await makeApiRequest(user);
                expect(status).toBe(201);
                const createdUser = body as User;
                expect(createdUser.cohortId).toBeDefined();
                await expect(getCohortByName(user.username)).resolves.toMatchObject({ id: createdUser.cohortId });
            });
        });
    });
});
