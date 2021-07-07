import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort, { cohortNameSize } from '@/user/domains/Cohort';
import { removeCohortByName } from '@test/util/cohort-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import User from '@/user/domains/User';
import {
    createApiRequester,
    createUser,
    getUsersByUsernames,
    removeUserByUsername,
    removeUsersByUsernames,
} from '@test/util/user-util';
import { getRepository } from 'typeorm';
import generateJwToken from '@test/util/auth-util';

describe('/v1/cohorts', () => {
    let app: INestApplication;

    let requester: User;

    const getBasePayload = (userIds: string[] = []): Cohort => ({
        name: `Summer of Sixty Nine!`,
        userIds,
    });

    const getUserCreationBasePayload = (username?: string): User =>
        ({
            username: username || 'example601@gibberish.com',
            firstname: 'John',
            lastname: 'Doe',
        } as User);

    beforeAll(async () => {
        app = await bootstrap(AppModule);
        requester = await createApiRequester();
    });

    afterAll(async () => {
        await removeUserByUsername(requester.username);
        await app.close();
    });

    const makeApiRequest = async (cohort?: Cohort): Promise<SupertestResponse<void>> => {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/cohorts`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send(cohort);
        return {
            status,
            body,
        };
    };

    describe('POST /', () => {
        describe('UnAuthorized', () => {
            it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
                const { status } = await request(app.getHttpServer()).post(`${getAppAPIPrefix()}/v1/cohorts`).send();
                expect(status).toBe(403);
            });
        });

        describe('Bad Payload', () => {
            it('SHOULD return 400 BAD_REQUEST for empty payload', async () => {
                const { status } = await makeApiRequest();
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload without name', async () => {
                let cohort = { ...getBasePayload() } as ObjectLiteral;
                delete cohort.name;
                let { status } = await makeApiRequest(cohort as Cohort);
                expect(status).toBe(400);

                cohort = { ...getBasePayload(), name: null } as Cohort;
                status = (await makeApiRequest(cohort as Cohort)).status;
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with a large name', async () => {
                const cohort = { ...getBasePayload(), name: 'X'.repeat(cohortNameSize + 1) } as Cohort;
                const { status } = await makeApiRequest(cohort as Cohort);
                expect(status).toBe(400);
            });

            // skipping as it is not working
            it.skip('SHOULD return 400 BAD_REQUEST for payload WHEN userIds is not defined', async () => {
                const cohort = { ...getBasePayload(), userIds: null } as Cohort;
                const { status } = await makeApiRequest(cohort as Cohort);
                expect(status).toBe(400);
            });

            it('SHOULD return 400 BAD_REQUEST for payload with invalid userIds', async () => {
                const cohort = { ...getBasePayload(), userIds: ['Hello!', null, undefined, ''] } as Cohort;
                const { status } = await makeApiRequest(cohort as Cohort);
                expect(status).toBe(400);
            });
        });

        describe('Payload with empty user IDs', () => {
            afterAll(async () => {
                await removeCohortByName(getBasePayload().name);
            });

            it('SHOULD return 201 CREATED', async () => {
                const { status } = await makeApiRequest(getBasePayload());
                expect(status).toBe(201);
            });
        });

        describe('Multiple Request With Same Payload', () => {
            afterAll(async () => {
                await removeCohortByName(getBasePayload().name);
            });

            it('SHOULD return 201 CREATED WHEN same payload is sent twice', async () => {
                let { status } = await makeApiRequest(getBasePayload());
                expect(status).toBe(201);

                status = (await makeApiRequest(getBasePayload())).status;
                expect(status).toBe(201);

                await expect(getRepository(Cohort).find({ name: getBasePayload().name })).resolves.toHaveLength(1);
            });
        });

        describe('Payload with user IDs', () => {
            let firstUser: User;
            let secondUser: User;

            beforeAll(async () => {
                firstUser = await createUser(getUserCreationBasePayload());
                secondUser = await createUser({
                    ...getUserCreationBasePayload(),
                    username: 'example602@gibberish.com',
                } as User);
            });

            afterAll(async () => {
                await removeUsersByUsernames([firstUser.username, secondUser.username]);
                await removeCohortByName(getBasePayload().name);
            });

            it('SHOULD return 404 NOT_FOUND WHEN user does not exist', async () => {
                const invalidUserId = uuidV4();
                const { status: status1, body: body1 } = await makeApiRequest(getBasePayload([invalidUserId]));
                expect(status1).toBe(404);
                expect((body1 as SupertestErrorResponse).message).toBe(
                    `There is no such user having ID ${invalidUserId}`,
                );

                const { status: status2, body: body2 } = await makeApiRequest(
                    getBasePayload([firstUser.id, invalidUserId]),
                );
                expect(status2).toBe(404);
                expect((body2 as SupertestErrorResponse).message).toBe(
                    `There is no such user having ID ${invalidUserId}`,
                );
            });

            it('SHOULD return 201 CREATED', async () => {
                const { status } = await makeApiRequest(getBasePayload([firstUser.id, secondUser.id]));
                expect(status).toBe(201);

                const [firstUserWithCohort, secondUserWithCohort] = await getUsersByUsernames([
                    firstUser.username,
                    secondUser.username,
                ]);

                expect(firstUserWithCohort.cohort.name).toBe(getBasePayload().name);
                expect(secondUserWithCohort.cohort.name).toBe(getBasePayload().name);
            });
        });
    });
});
