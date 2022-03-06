import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortByName } from '@test/util/cohort-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import User from '@/user/domains/User';
import {
    createApiRequester,
    createUser,
    getUsersByUsernames,
    removeUserByUsername,
    removeUsersByUsernames,
} from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';

describe('/v1/cohorts/:name', () => {
    let app: INestApplication;

    let requester: User;

    const getBasePayload = (usernames: string[] = []): Cohort => ({
        name: `What a wonderful world!`,
        usernames,
    });

    const getUserCreationBasePayload = (username?: string): User =>
        ({
            username: username || 'example801@gibberish.com',
            firstname: 'John',
            lastname: 'Doe',
        } as User);

    beforeAll(async () => {
        app = await kickOff(AppModule);
        requester = await createApiRequester();
    });

    afterAll(async () => {
        await removeUserByUsername(requester.username);
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
            const invalidUsernames = [uuidV4(), uuidV4(), uuidV4()];
            const { status: status1, body: body1 } = await makeAuthorizedApiRequest(getBasePayload().name, [
                invalidUsernames[0],
                invalidUsernames[1],
            ]);
            expect(status1).toBe(404);
            expect((body1 as SupertestErrorResponse).message).toBe(
                `There are no such users having usernames ${[invalidUsernames[0], invalidUsernames[1]].join(', ')}`,
            );

            const { status: status2, body: body2 } = await makeAuthorizedApiRequest(getBasePayload().name, [
                firstUser.username,
                invalidUsernames[2],
            ]);
            expect(status2).toBe(404);
            expect((body2 as SupertestErrorResponse).message).toBe(
                `There is no such user having username ${invalidUsernames[2]}`,
            );
        });

        it('SHOULD return 200 OK', async () => {
            const { status } = await makeAuthorizedApiRequest(getBasePayload().name, [
                firstUser.username,
                secondUser.username,
            ]);
            expect(status).toBe(200);

            const [firstUserWithCohort, secondUserWithCohort] = await getUsersByUsernames([
                firstUser.username,
                secondUser.username,
            ]);

            expect(firstUserWithCohort.cohort.name).toBe(getBasePayload().name);
            expect(secondUserWithCohort.cohort.name).toBe(getBasePayload().name);
        });
    });
});
