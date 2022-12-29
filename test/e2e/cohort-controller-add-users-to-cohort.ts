import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidV4 } from 'uuid';
import getAppAPIPrefix from '@test/util/service-util';
import Cohort from '@/user/domains/Cohort';
import { createCohort, removeCohortsWithRelationsByIds } from '@test/util/cohort-util';
import SupertestResponse, { SupertestErrorResponse } from '@test/util/supertest-util';
import User from '@/user/domains/User';
import {
    createApiRequester,
    createUser,
    generateUsername,
    getUsersByUsernames,
    removeUsersByUsernames,
    updateCohortById,
} from '@test/util/user-util';
import generateJwToken from '@test/util/auth-util';
import { createVocabulary, getVocabularyById, getVocabularyWithDefinitions } from '@test/util/vocabulary-util';

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
            username: generateUsername(),
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
        let thirdUser: User;
        let cohort: Cohort;

        beforeAll(async () => {
            firstUser = await createUser(getUserCreationBasePayload());
            cohort = await createCohort(getBasePayload([firstUser.username]));
            firstUser.cohort = cohort;
            cohortIds.push(cohort.id);

            secondUser = await createUser(getUserCreationBasePayload());
            cohort = await createCohort(getBasePayload([secondUser.username]));
            secondUser.cohort = cohort;
            cohortIds.push(cohort.id);

            thirdUser = await createUser(getUserCreationBasePayload());
            cohort = await createCohort(getBasePayload([thirdUser.username]));
            thirdUser.cohort = cohort;
            cohortIds.push(cohort.id);
        });

        afterAll(async () => {
            await removeCohortsWithRelationsByIds(cohortIds);
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

        it('SHOULD return 200 OK AND associate users with cohort', async () => {
            // Arrange
            const currentCohortIds = [firstUser.cohort.id, secondUser.cohort.id, thirdUser.cohort.id];

            const anotherCohort = await createCohort(getBasePayload());
            cohortIds.push(anotherCohort.id);

            // Act
            const { status } = await makeAuthorizedApiRequest(anotherCohort.name, [
                firstUser.username,
                secondUser.username,
                thirdUser.username,
            ]);

            // Assert
            expect(status).toBe(200);

            const [firstUserWithCohort, secondUserWithCohort, thirdUserWithCohort] = await getUsersByUsernames([
                firstUser.username,
                secondUser.username,
                thirdUser.username,
            ]);

            expect(firstUserWithCohort.cohort.name).toBe(anotherCohort.name);
            expect(secondUserWithCohort.cohort.name).toBe(anotherCohort.name);
            expect(thirdUserWithCohort.cohort.name).toBe(anotherCohort.name);

            // Post Assert
            await updateCohortById(firstUser.id, currentCohortIds[0]);
            await updateCohortById(secondUser.id, currentCohortIds[1]);
            await updateCohortById(thirdUser.id, currentCohortIds[2]);
        });

        it('SHOULD return 200 OK AND add a new user', async () => {
            // Arrange
            const currentCohortIds = [firstUser.cohort.id, secondUser.cohort.id, thirdUser.cohort.id];

            const anotherCohort = await createCohort(getBasePayload([firstUser.username, secondUser.username]));
            cohortIds.push(anotherCohort.id);

            // Act
            const { status } = await makeAuthorizedApiRequest(anotherCohort.name, [thirdUser.username]);

            // Assert
            expect(status).toBe(200);

            const [firstUserWithCohort, secondUserWithCohort, thirdUserWithCohort] = await getUsersByUsernames([
                firstUser.username,
                secondUser.username,
                thirdUser.username,
            ]);

            expect(firstUserWithCohort.cohort.name).toBe(anotherCohort.name);
            expect(secondUserWithCohort.cohort.name).toBe(anotherCohort.name);
            expect(thirdUserWithCohort.cohort.name).toBe(anotherCohort.name);

            // Post Assert
            await updateCohortById(firstUser.id, currentCohortIds[0]);
            await updateCohortById(secondUser.id, currentCohortIds[1]);
            await updateCohortById(thirdUser.id, currentCohortIds[2]);
        });

        it('SHOULD return 200 OK AND move all vocabs to the new cohort', async () => {
            // Arrange
            const currentCohortIds = [firstUser.cohort.id, secondUser.cohort.id, thirdUser.cohort.id];
            const firstUserVocabulary = await createVocabulary(getVocabularyWithDefinitions(), currentCohortIds[0]);
            const secondUserVocabulary = await createVocabulary(getVocabularyWithDefinitions(), currentCohortIds[1]);
            const thirdUserVocabulary = await createVocabulary(getVocabularyWithDefinitions(), currentCohortIds[2]);

            const anotherCohort = await createCohort(getBasePayload());
            cohortIds.push(anotherCohort.id);

            // Act
            const { status } = await makeAuthorizedApiRequest(anotherCohort.name, [
                firstUser.username,
                secondUser.username,
                thirdUser.username,
            ]);

            // Assert
            expect(status).toBe(200);
            expect((await getVocabularyById(firstUserVocabulary.id)).cohortId).toBe(anotherCohort.id);
            expect((await getVocabularyById(secondUserVocabulary.id)).cohortId).toBe(anotherCohort.id);
            expect((await getVocabularyById(thirdUserVocabulary.id)).cohortId).toBe(anotherCohort.id);

            // Post Assert
            await updateCohortById(firstUser.id, currentCohortIds[0]);
            await updateCohortById(secondUser.id, currentCohortIds[1]);
            await updateCohortById(thirdUser.id, currentCohortIds[2]);
        });

        it('SHOULD return 200 OK, move all vocabs to the new cohort AND gracefully handle UQ_Vocabulary_word_cohortId', async () => {
            // Arrange
            const currentCohortIds = [firstUser.cohort.id, secondUser.cohort.id, thirdUser.cohort.id];
            const firstUserVocabulary = await createVocabulary(getVocabularyWithDefinitions(), currentCohortIds[0]);
            const secondUserVocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word: firstUserVocabulary.word,
                },
                currentCohortIds[1],
            );
            const thirdUserVocabulary = await createVocabulary(
                {
                    ...getVocabularyWithDefinitions(),
                    word: firstUserVocabulary.word,
                },
                currentCohortIds[2],
            );

            const anotherCohort = await createCohort(getBasePayload());
            cohortIds.push(anotherCohort.id);

            // Act
            const { status } = await makeAuthorizedApiRequest(anotherCohort.name, [
                firstUser.username,
                secondUser.username,
                thirdUser.username,
            ]);

            // Assert
            expect(status).toBe(200);
            expect(await getVocabularyById(firstUserVocabulary.id)).toMatchObject({
                cohortId: anotherCohort.id,
                word: firstUserVocabulary.word,
            });
            expect(await getVocabularyById(secondUserVocabulary.id)).toMatchObject({
                cohortId: anotherCohort.id,
                word: expect.stringMatching(
                    `---SUFFIX_ADDED_BY_SYSTEM_AS_IT_IS_DUPLICATED_WHICH_WAS_ADDED_BY_ANOTHER_MEMBER_OF_THE_COHORT---`,
                ),
            });
            expect(await getVocabularyById(thirdUserVocabulary.id)).toMatchObject({
                cohortId: anotherCohort.id,
                word: expect.stringMatching(
                    `---SUFFIX_ADDED_BY_SYSTEM_AS_IT_IS_DUPLICATED_WHICH_WAS_ADDED_BY_ANOTHER_MEMBER_OF_THE_COHORT---`,
                ),
            });

            // Post Assert
            await updateCohortById(firstUser.id, currentCohortIds[0]);
            await updateCohortById(secondUser.id, currentCohortIds[1]);
            await updateCohortById(thirdUser.id, currentCohortIds[2]);
        });
    });
});
