import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsByIds } from '@test/util/cohort-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import User from '@/user/domains/User';
import {
    createApiRequester,
    createUser,
    getUsersByUsernames,
    removeUsersByUsernames,
    resetCohortById,
} from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';

describe('/v1/cohorts/:name', () => {
    let app: INestApplication;

    let requester: User;

    const cohortIds: string[] = [];

    const getBasePayload = (usernames: string[] = []): Cohort => ({
        name: `Cohort _ ${uuidV4()}`,
        usernames,
    });

    const getUserCreationBasePayload = (): User =>
        ({
            username: `example+${uuidV4()}@firecrackervocabulary.com`,
            firstname: 'John',
            lastname: 'Doe',
        } as User);

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
    });

    afterAll(async () => {
        await removeUsersByUsernames([requester.username]);
        await app.close();
    });

    const makeAuthorizedApiRequest = async (
        name: string,
        usernames: string[] = [],
    ): Promise<SupertestResponse<void>> => {
        const { status, body } = await request(app.getHttpServer())
            .put(`${getAppAPIPrefix()}/v1/cohorts/${name}`)
            .set('Authorization', `Bearer ${generateJwToken(requester)}`)
            .send(usernames);
        return {
            status,
            body,
        };
    };

    describe('PUT', () => {
        let firstUser: User;
        let secondUser: User;
        let cohort: Cohort;

        beforeAll(async () => {
            firstUser = await createUser(getUserCreationBasePayload());
            secondUser = await createUser(getUserCreationBasePayload());

            cohort = await createCohort(getBasePayload());
            cohortIds.push(cohort.id);
        });

        afterAll(async () => {
            await removeUsersByUsernames([firstUser.username, secondUser.username]);
            await removeCohortsByIds(cohortIds);
        });

        it('SHOULD return 403 FORBIDDEN WHEN JWT is missing', async () => {
            const { status } = await request(app.getHttpServer())
                .put(`${getAppAPIPrefix()}/v1/cohorts/${uuidV4()}`)
                .send();
            expect(status).toBe(403);
        });

        it('SHOULD return 404 NOT_FOUND WHEN cohort does not exist', async () => {
            const { status } = await makeAuthorizedApiRequest('I Do not exist', [uuidV4()]);
            expect(status).toBe(404);
        });

        it('SHOULD return 404 NOT_FOUND WHEN user does not exist', async () => {
            const invalidUsername = uuidV4();

            const { status, body } = await makeAuthorizedApiRequest(cohort.name, [firstUser.username, invalidUsername]);

            expect(status).toBe(404);
            expect((body as SupertestErrorResponse).message).toBe(
                `There is no such user having username ${invalidUsername}`,
            );
        });

        it('SHOULD return 404 NOT_FOUND WHEN users do not exist', async () => {
            const invalidUsernames = [uuidV4(), uuidV4()];
            const { status, body } = await makeAuthorizedApiRequest(cohort.name, [
                invalidUsernames[0],
                invalidUsernames[1],
            ]);

            expect(status).toBe(404);
            expect((body as SupertestErrorResponse).message).toBe(
                `There are no such users having usernames ${[invalidUsernames[0], invalidUsernames[1]].join(', ')}`,
            );
        });

        it('SHOULD return 200 OK', async () => {
            const { status } = await makeAuthorizedApiRequest(cohort.name, [firstUser.username, secondUser.username]);
            expect(status).toBe(200);

            const [firstUserWithCohort, secondUserWithCohort] = await getUsersByUsernames([
                firstUser.username,
                secondUser.username,
            ]);

            expect(firstUserWithCohort.cohort.name).toBe(cohort.name);
            expect(secondUserWithCohort.cohort.name).toBe(cohort.name);

            await resetCohortById(firstUser.id);
            await resetCohortById(secondUser.id);
        });
    });
});
