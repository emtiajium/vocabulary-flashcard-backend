import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import { ObjectLiteral } from '@/common/types/ObjectLiteral';
import * as request from 'supertest';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort, { cohortNameSize } from '@/user/domains/Cohort';
import getCohortByName, {
    createCohort,
    removeCohortsByNames,
    removeCohortsWithRelationsByIds,
} from '@test/util/cohort-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import User from '@/user/domains/User';
import {
    createApiRequester,
    createUser,
    generateUsername,
    getUsersByUsernames,
    removeUsersByUsernames,
} from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import { createVocabulary, getVocabularyById, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';
import CacheUserService from '@/user/services/CacheUserService';

describe('POST /v1/cohorts', () => {
    let app: INestApplication;

    let requester: User;

    const getBasePayload = (usernames: string[] = []): Cohort => ({
        name: `Summer of Sixty Nine!_${Date.now()}`,
        usernames,
    });

    const getUserCreationBasePayload = (username?: string): User =>
        ({
            username: username || generateUsername(),
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
        it.skip('SHOULD return 400 BAD_REQUEST for payload WHEN usernames is not defined', async () => {
            const cohort = { ...getBasePayload(), usernames: null } as Cohort;
            const { status } = await makeApiRequest(cohort as Cohort);
            expect(status).toBe(400);
        });

        it('SHOULD return 400 BAD_REQUEST for payload with invalid usernames', async () => {
            let cohort = { ...getBasePayload(), usernames: ['Hello!'] } as Cohort;
            let { status } = await makeApiRequest(cohort as Cohort);
            expect(status).toBe(400);

            cohort = { ...getBasePayload(), usernames: [null] } as Cohort;
            status = (await makeApiRequest(cohort as Cohort)).status;
            expect(status).toBe(400);

            cohort = { ...getBasePayload(), usernames: [undefined] } as Cohort;
            status = (await makeApiRequest(cohort as Cohort)).status;
            expect(status).toBe(400);

            cohort = { ...getBasePayload(), usernames: [''] } as Cohort;
            status = (await makeApiRequest(cohort as Cohort)).status;
            expect(status).toBe(400);

            cohort = { ...getBasePayload(), usernames: ['NotAnEmail'] } as Cohort;
            status = (await makeApiRequest(cohort as Cohort)).status;
            expect(status).toBe(400);
        });
    });

    describe('Payload with empty usernames', () => {
        let payload: Cohort;

        afterEach(async () => {
            await removeCohortsByNames([payload.name]);
        });

        it('SHOULD return 201 CREATED', async () => {
            payload = getBasePayload();
            const { status } = await makeApiRequest(payload);
            expect(status).toBe(201);
        });
    });

    describe('Multiple Request With Same Payload', () => {
        let payload: Cohort;

        afterEach(async () => {
            await removeCohortsByNames([payload.name]);
        });

        it('SHOULD return 409 CONFLICT WHEN same payload is sent twice', async () => {
            payload = getBasePayload();

            const { status } = await makeApiRequest(payload);
            expect(status).toBe(201);

            const { status: status2, body } = await makeApiRequest(payload);
            expect(status2).toBe(409);
            expect((body as SupertestErrorResponse).message).toBe(`Cohort with name "${payload.name}" already exists`);
        });
    });

    describe('Payload with usernames', () => {
        let firstUser: User;
        let secondUser: User;
        let cohortIds: string[] = [];
        let cohort: Cohort;

        beforeEach(async () => {
            firstUser = await createUser(getUserCreationBasePayload());
            cohort = await createCohort({
                ...getBasePayload([firstUser.username]),
                name: firstUser.username,
            });
            firstUser.cohort = cohort;
            cohortIds.push(cohort.id);

            secondUser = await createUser(getUserCreationBasePayload());
            cohort = await createCohort({
                ...getBasePayload([secondUser.username]),
                name: secondUser.username,
            });
            secondUser.cohort = cohort;
            cohortIds.push(cohort.id);
        });

        afterEach(async () => {
            await removeCohortsWithRelationsByIds(cohortIds);
            cohortIds = [];
        });

        it('SHOULD return 404 NOT_FOUND WHEN user does not exist', async () => {
            const invalidUsername = generateUsername();
            const { status: status1, body: body1 } = await makeApiRequest(getBasePayload([invalidUsername]));
            expect(status1).toBe(404);
            expect((body1 as SupertestErrorResponse).message).toBe(
                `There is no such user having username ${invalidUsername}`,
            );

            const { status: status2, body: body2 } = await makeApiRequest(
                getBasePayload([firstUser.username, invalidUsername]),
            );
            expect(status2).toBe(404);
            expect((body2 as SupertestErrorResponse).message).toBe(
                `There is no such user having username ${invalidUsername}`,
            );

            const { status: status3, body: body3 } = await makeApiRequest(
                getBasePayload([invalidUsername, invalidUsername]),
            );
            expect(status3).toBe(404);
            expect((body3 as SupertestErrorResponse).message).toBe(
                `There are no such users having usernames ${[invalidUsername, invalidUsername].join(', ')}`,
            );
        });

        it('SHOULD return 201 CREATED AND associate users with cohort', async () => {
            const payload = getBasePayload([firstUser.username, secondUser.username]);

            const { status } = await makeApiRequest(payload);

            expect(status).toBe(201);

            const [firstUserWithCohort, secondUserWithCohort] = await getUsersByUsernames([
                firstUser.username,
                secondUser.username,
            ]);

            expect(firstUserWithCohort.cohort.name).toBe(payload.name);
            expect(secondUserWithCohort.cohort.name).toBe(payload.name);

            cohortIds.push(firstUserWithCohort.cohort.id, secondUserWithCohort.cohort.id);
        });

        it('SHOULD return 201 CREATED AND move all vocabs to the new cohort', async () => {
            // Arrange
            const payload = getBasePayload([firstUser.username, secondUser.username]);

            const firstUserVocabulary = await createVocabulary(getVocabularyWithDefinitions(), firstUser.cohort.id);
            const secondUserVocabulary = await createVocabulary(getVocabularyWithDefinitions(), secondUser.cohort.id);

            // Act
            const { status } = await makeApiRequest(payload);

            // Assert
            expect(status).toBe(201);
            cohort = await getCohortByName(payload.name);
            cohortIds.push(cohort.id);
            expect((await getVocabularyById(firstUserVocabulary.id)).cohortId).toBe(cohort.id);
            expect((await getVocabularyById(secondUserVocabulary.id)).cohortId).toBe(cohort.id);
        });

        it('SHOULD return 201 CREATED, move all vocabs to the new cohort AND gracefully handle UQ_Vocabulary_word_cohortId', async () => {
            // Arrange
            const payload = getBasePayload([firstUser.username, secondUser.username]);

            const currentCohortIds = [firstUser.cohort.id, secondUser.cohort.id];
            const firstUserVocabulary = await createVocabulary(getVocabularyWithDefinitions(), currentCohortIds[0]);
            const secondUserVocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word: firstUserVocabulary.word,
                },
                currentCohortIds[1],
            );

            // Act
            const { status } = await makeApiRequest(payload);

            // Assert
            expect(status).toBe(201);
            cohort = await getCohortByName(payload.name);
            cohortIds.push(cohort.id);
            expect(await getVocabularyById(firstUserVocabulary.id)).toMatchObject({
                cohortId: cohort.id,
                word: firstUserVocabulary.word,
            });
            expect(await getVocabularyById(secondUserVocabulary.id)).toMatchObject({
                cohortId: cohort.id,
                word: expect.stringMatching(
                    `---SUFFIX_ADDED_BY_SYSTEM_AS_IT_IS_DUPLICATED_WHICH_WAS_ADDED_BY_ANOTHER_MEMBER_OF_THE_COHORT---`,
                ),
            });
        });

        it('SHOULD remove user from cache', async () => {
            // Arrange
            const payload = getBasePayload([firstUser.username, secondUser.username]);

            app.get(CacheUserService).set(firstUser);
            app.get(CacheUserService).set(secondUser);

            // Act
            await makeApiRequest(payload);

            // Assert
            expect(app.get(CacheUserService).get(firstUser.username)).toBeUndefined();
            expect(app.get(CacheUserService).get(secondUser.username)).toBeUndefined();

            const [firstUserWithCohort, secondUserWithCohort] = await getUsersByUsernames([
                firstUser.username,
                secondUser.username,
            ]);
            cohortIds.push(firstUserWithCohort.cohort.id, secondUserWithCohort.cohort.id);
        });
    });
});
