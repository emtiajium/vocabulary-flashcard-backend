import { ForbiddenException, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { kickOff } from '@/bootstrap';
import getAppAPIPrefix from '@test/util/service-util';
import AppModule from '@/AppModule';
import { generateUsername, removeUsersByUsernames } from '@test/util/user-util';
import { removeCohortsByNames } from '@test/util/cohort-util';
import User from '@/user/domains/User';
import SupertestResponse from '@test/util/supertest-util';
import generateJwToken from '@test/util/auth-util';
import TokenManager, { DecodedToken } from '@/common/services/TokenManager';
import { decode } from 'jsonwebtoken';
import ClientType from '@/common/domains/ClientType';
import CacheUserService from '@/user/services/CacheUserService';
import DataSource from '@/common/persistence/TypeormConfig';
import { plainToInstance } from 'class-transformer';

describe('/v1/users', () => {
    let app: INestApplication;

    const generatedUsernames: string[] = [];
    let generatedUser: User;

    const getBasePayload = (): { idToken: string } => {
        const generatedUsername = generateUsername();
        generatedUsernames.push(generatedUsername);
        generatedUser = plainToInstance(User, {
            username: generatedUsername,
            firstname: 'John',
            lastname: 'Doe',
            profilePictureUrl: 'https://firecrackervocabulary.com/files/images/blah.png',
        });
        return {
            idToken: generateJwToken(generatedUser),
        };
    };

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
    });

    afterAll(async () => {
        await removeUsersByUsernames(generatedUsernames);
        await removeCohortsByNames(generatedUsernames);
        await app.close();
        await DataSource.destroy();
    });

    const makeApiRequest = async (
        payload: { idToken: string },
        client = ClientType.ANDROID_NATIVE,
        versionCode = 68,
    ): Promise<SupertestResponse<User>> => {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/users`)
            .set('X-Client-Id', client)
            .set('X-Version-Code', `${versionCode}`)
            .send(payload);
        return {
            status,
            body,
        };
    };

    describe('POST /', () => {
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
                const { status } = await makeApiRequest(user);

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
                const { status } = await makeApiRequest(user);

                // Assert
                expect(status).toBe(403);
                expect(decodeJwTokenV2Mock).toHaveBeenCalled();

                // Post Assert
                decodeJwTokenV2Mock.mockRestore();
            });
        });

        describe('Cache', () => {
            it('SHOULD remove user from cache', async () => {
                // Arrange
                const decodeJwTokenV2Mock = jest
                    .spyOn(TokenManager.prototype, 'decodeJwTokenV2')
                    .mockImplementation(async (token: string) => {
                        return decode(token) as DecodedToken;
                    });

                const user = getBasePayload();
                app.get(CacheUserService).set(generatedUser);

                // Act
                await makeApiRequest(user);

                // Assert
                expect(app.get(CacheUserService).get(generatedUser.username)).toBeUndefined();

                // Post Assert
                decodeJwTokenV2Mock.mockRestore();
            });
        });
    });
});
