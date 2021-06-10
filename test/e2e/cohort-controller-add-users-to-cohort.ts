import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import getCohortByName, { createCohort, removeCohortByName } from '@test/util/cohort-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import User from '@/user/domains/User';
import { createUser, getUsersByUsernames, removeUsersByUsernames } from '@test/util/user-util';

describe('/v1/cohorts/:name', () => {
    let app: INestApplication;

    const getBasePayload = (userIds: string[] = []): Cohort => ({
        name: `What a wonderful world!`,
        userIds,
    });

    const getUserCreationBasePayload = (username?: string): User =>
        ({
            username: username || 'example801@gibberish.com',
            firstname: 'John',
            lastname: 'Doe',
        } as User);

    beforeAll(async () => {
        app = await bootstrap(AppModule);
    });

    afterAll(async () => {
        await app.close();
    });

    const makeApiRequest = async (name: string, userIds: string[] = []): Promise<SupertestResponse<void>> => {
        const { status, body } = await request(app.getHttpServer())
            .put(`${getAppAPIPrefix()}/v1/cohorts/${name}`)
            .send(userIds);
        return {
            status,
            body,
        };
    };

    describe('PUT', () => {
        let firstUser: User;
        let secondUser: User;

        beforeAll(async () => {
            firstUser = await createUser(getUserCreationBasePayload());
            secondUser = await createUser({
                ...getUserCreationBasePayload(),
                username: 'example802@gibberish.com',
            } as User);

            await createCohort(getBasePayload());
        });

        afterAll(async () => {
            await removeUsersByUsernames([firstUser.username, secondUser.username]);
            await removeCohortByName(getBasePayload().name);
        });

        it('SHOULD return 404 NOT_FOUND WHEN cohort does not exist', async () => {
            const { status } = await makeApiRequest('I Do not exist', [uuidV4()]);
            expect(status).toBe(404);
        });

        it('SHOULD return 404 NOT_FOUND WHEN user does not exist', async () => {
            const invalidUserIds = [uuidV4(), uuidV4(), uuidV4()];
            const { status: status1, body: body1 } = await makeApiRequest(getBasePayload().name, [
                invalidUserIds[0],
                invalidUserIds[1],
            ]);
            expect(status1).toBe(404);
            expect((body1 as SupertestErrorResponse).message).toBe(
                `There are no such users having IDs ${[invalidUserIds[0], invalidUserIds[1]].join(', ')}`,
            );

            const { status: status2, body: body2 } = await makeApiRequest(getBasePayload().name, [
                firstUser.id,
                invalidUserIds[2],
            ]);
            expect(status2).toBe(404);
            expect((body2 as SupertestErrorResponse).message).toBe(
                `There is no such user having ID ${invalidUserIds[2]}`,
            );
        });

        it('SHOULD return 200 OK', async () => {
            const { status } = await makeApiRequest(getBasePayload().name, [firstUser.id, secondUser.id]);
            expect(status).toBe(200);

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
