import User from '@/user/domains/User';
import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { createUser, generateUsername, getUsersByUsernames, removeUsersByUsernames } from '@test/util/user-util';
import Cohort from '@/user/domains/Cohort';
import CohortService from '@/user/services/CohortService';
import getCohortByName, { removeCohortsByNames } from '@test/util/cohort-util';

describe('Cohort Service', () => {
    let app: INestApplication;

    const getUserPayload = (username = generateUsername()): User =>
        ({
            username,
            firstname: 'John',
            lastname: 'Doe',
        } as User);

    beforeAll(async () => {
        app = await kickOff(AppModule);
    });

    afterAll(async () => {
        await app.close();
    });

    it('SHOULD be tagged users to a cohort', async () => {
        // Arrange
        const cohortService = app.get(CohortService);

        const firstUserPayload = getUserPayload();
        const firstUser = await createUser(firstUserPayload);

        const secondUserPayload = getUserPayload(generateUsername());
        const secondUser = await createUser(secondUserPayload);

        const cohortPayload: Cohort = { name: 'The best cohort ever exist', usernames: [] } as Cohort;
        await cohortService.createCohort(cohortPayload);

        // Act
        await cohortService.addUsersToCohort(cohortPayload.name, [firstUser.username, secondUser.username]);

        // Assert
        const updatedCohort: Cohort = await getCohortByName(cohortPayload.name);

        expect(updatedCohort.updatedAt.toISOString()).toBe(updatedCohort.createdAt.toISOString());

        const cohort: Cohort = await getCohortByName(cohortPayload.name);
        const usersWithCohort: User[] = await getUsersByUsernames([firstUser.username, secondUser.username]);

        usersWithCohort.forEach((user) => {
            expect(user.cohort.id).toBe(cohort.id);
            expect(user.cohort.name).toBe(cohort.name);
        });

        await removeUsersByUsernames([firstUser.username, secondUser.username]);
        await removeCohortsByNames([cohortPayload.name]);
    });
});
