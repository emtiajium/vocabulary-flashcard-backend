import User from '@/user/domains/User';
import { INestApplication } from '@nestjs/common';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { createUser, getUsersByUsernames, removeUsersByUsernames } from '@test/util/user-util';
import Cohort from '@/user/domains/Cohort';
import CohortService from '@/user/services/CohortService';
import getCohortByName, { removeCohortByName } from '@test/util/cohort-util';

describe('Cohort Service', () => {
    let app: INestApplication;

    const getUserPayload = (username = 'example404@gibberish.com'): User =>
        ({
            username,
            firstname: 'John',
            lastname: 'Doe',
        } as User);

    beforeAll(async () => {
        app = await bootstrap(AppModule);
    });

    afterAll(async () => {
        await app.close();
    });

    it('SHOULD be tagged users to a cohort', async () => {
        const cohortService = app.get(CohortService);

        const firstUserPayload = getUserPayload();
        const firstUser = await createUser(firstUserPayload);

        const secondUserPayload = getUserPayload('example405@gibberish.com');
        const secondUser = await createUser(secondUserPayload);

        const cohortPayload: Cohort = { name: 'The best cohort ever exist', usernames: [] } as Cohort;
        await cohortService.createCohort(cohortPayload);
        const cohort: Cohort = await getCohortByName(cohortPayload.name);

        await cohortService.addUsersToCohort(cohortPayload.name, [firstUser.username, secondUser.username]);

        const updatedCohort: Cohort = await getCohortByName(cohortPayload.name);

        expect(updatedCohort.updatedAt.toISOString()).toBe(updatedCohort.createdAt.toISOString());

        const usersWithCohort: User[] = await getUsersByUsernames([firstUser.username, secondUser.username]);

        usersWithCohort.forEach((user) => {
            expect(user.cohort.id).toBe(cohort.id);
            expect(user.cohort.name).toBe(cohort.name);
        });

        await removeUsersByUsernames([firstUser.username, secondUser.username]);
        await removeCohortByName(cohortPayload.name);
    });
});
