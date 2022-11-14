import { ForbiddenException, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import { kickOff } from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import getUserByUsername, { generateUsername, removeUsersByUsernames } from '@test/util/user-util';
import getCohortByName, { removeCohortsByNames } from '@test/util/cohort-util';
import User from '@/user/domains/User';
import SupertestResponse from '@test/util/supertest-util';
import generateJwToken from '@test/util/auth-util';
import TokenManager, { DecodedToken } from '@/common/services/TokenManager';
import { decode } from 'jsonwebtoken';
import ClientType from '@/common/domains/ClientType';

describe('/v1/users', () => {
    let app: INestApplication;

    const generatedUsernames: string[] = [];

    const getBasePayload = (): User => {
        const generatedUsername = generateUsername();
        generatedUsernames.push(generatedUsername);
        return {
            username: generatedUsername,
            firstname: 'John',
            lastname: 'Doe',
            profilePictureUrl: 'https://firecrackervocabulary.com/files/images/blah.png',
        } as User;
    };

    beforeAll(async () => {
        app = await kickOff(AppModule);
    });

    afterAll(async () => {
        await removeUsersByUsernames(generatedUsernames);
        await removeCohortsByNames(generatedUsernames);
        await app.close();
    });

    const makeApiRequest = async (
        user?: User,
        isPublic = true,
        client = ClientType.ANDROID_NATIVE,
        versionCode = 68,
    ): Promise<SupertestResponse<User>> => {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/users`)
            .set('X-Client-Id', client)
            .set('X-Version-Code', `${versionCode}`)
            .set('Authorization', isPublic ? '' : `Bearer ${generateJwToken(user)}`)
            .send(user);
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

            it('SHOULD return 400 BAD_REQUEST WHEN username is not an email', async () => {
                const user = { ...getBasePayload(), username: 'NotAnEmail' };
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

        describe('Success | Without token', () => {
            it('SHOULD return 403 FORBIDDEN WHEN the token is not present AND the client is WebApp', async () => {
                // Arrange
                const user = getBasePayload();

                // Act
                const { status } = await makeApiRequest(user, true, ClientType.WEB);

                // Assert
                expect(status).toBe(403);
            });

            it('SHOULD return 403 FORBIDDEN WHEN the token is not present AND the client is AndroidNativeApp AND version code is 69 or above', async () => {
                // Arrange
                const user = getBasePayload();

                // Act
                const { status } = await makeApiRequest(user, true, ClientType.ANDROID_NATIVE, 69);

                // Assert
                expect(status).toBe(403);
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

        describe('Success | With token', () => {
            it('SHOULD return 201 CREATED WHEN there is token', async () => {
                // Arrange
                const decodeJwTokenV2Mock = jest
                    .spyOn(TokenManager.prototype, 'decodeJwTokenV2')
                    .mockImplementation(async (token: string) => {
                        return decode(token) as DecodedToken;
                    });

                const user = getBasePayload();

                // Act
                const { status } = await makeApiRequest(user, false, ClientType.ANDROID_NATIVE, 69);

                // Assert
                expect(status).toBe(201);
                expect(decodeJwTokenV2Mock).toHaveBeenCalled();

                // Post Assert
                decodeJwTokenV2Mock.mockRestore();
            });

            it('SHOULD return 403 FORBIDDEN WHEN the token is invalid', async () => {
                // Arrange
                const decodeJwTokenV2Mock = jest
                    .spyOn(TokenManager.prototype, 'decodeJwTokenV2')
                    .mockImplementation(() => {
                        throw new ForbiddenException();
                    });

                const user = getBasePayload();

                // Act
                const { status } = await makeApiRequest(user, false, ClientType.ANDROID_NATIVE, 69);

                // Assert
                expect(status).toBe(403);
                expect(decodeJwTokenV2Mock).toHaveBeenCalled();

                // Post Assert
                decodeJwTokenV2Mock.mockRestore();
            });
        });
    });
});
