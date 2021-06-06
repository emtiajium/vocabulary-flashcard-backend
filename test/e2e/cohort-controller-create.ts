import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import getCohortByName, { removeCohortByName } from '@test/util/cohort-util';
import SupertestResponse from '@test/util/supertest';
import User from '@/user/domains/User';
import { createUser, getUsersByUsernames, removeUsersByUsernames } from '@test/util/user-util';
import { getRepository } from 'typeorm';

describe('/v1/cohorts', () => {
    let app: INestApplication;

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
    });

    afterAll(async () => {
        await app.close();
    });

    const makeApiRequest = async (cohort?: Cohort): Promise<SupertestResponse<Cohort>> => {
        const { status, body } = await request(app.getHttpServer())
            .post(`${getAppAPIPrefix()}/v1/cohorts`)
            .send(cohort);
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

            it('SHOULD return 400 BAD_REQUEST for payload without name', async () => {
                const cohort = { ...getBasePayload() } as ObjectLiteral;
                delete cohort.name;
                const { status } = await makeApiRequest(cohort as Cohort);
                expect(status).toBe(400);
            });
        });

        describe('Payload with empty user IDs', () => {
            beforeEach(async () => {
                await removeCohortByName(getBasePayload().name);
            });

            afterAll(async () => {
                await removeCohortByName(getBasePayload().name);
            });

            it('SHOULD return 201 CREATED', async () => {
                const { status } = await makeApiRequest(getBasePayload());
                expect(status).toBe(201);
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
                let { status } = await makeApiRequest(getBasePayload([uuidV4()]));
                expect(status).toBe(404);

                status = (await makeApiRequest(getBasePayload([firstUser.id, uuidV4()]))).status;
                expect(status).toBe(404);
            });

            it('SHOULD return 201 CREATED', async () => {
                const { status } = await makeApiRequest(getBasePayload([firstUser.id, secondUser.id]));
                expect(status).toBe(201);

                const [firstUserWithCohort, secondUserWithCohort] = await getUsersByUsernames([
                    firstUser.username,
                    secondUser.username,
                ]);

                const { name: cohortName } = getBasePayload();

                await expect(firstUserWithCohort.cohort.name).toBe(getBasePayload().name);
                await expect(secondUserWithCohort.cohort.name).toBe(getBasePayload().name);

                const cohort = await getCohortByName(cohortName);

                expect(cohort.userIds).toEqual(expect.arrayContaining([firstUser.id, secondUser.id]));
            });
        });
    });
});
