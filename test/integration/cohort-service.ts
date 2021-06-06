import { getRepository } from 'typeorm';
import User from '@/user/domains/User';
import { INestApplication } from '@nestjs/common';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { createUser, removeUserByUsername } from '@test/util/user-util';
import Cohort from '@/user/domains/Cohort';
import CohortService from '@/user/services/CohortService';

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

    it('SHOULD insert users into a cohort', async () => {
        const cohortService = app.get(CohortService);

        const firstUserPayload = getUserPayload();
        await removeUserByUsername(firstUserPayload.username);
        const firstUser = await createUser(firstUserPayload);

        const secondUserPayload = getUserPayload('example405@gibberish.com');
        await removeUserByUsername(secondUserPayload.username);
        const secondUser = await createUser(secondUserPayload);

        const cohortPayload: Cohort = { name: 'The best cohort ever exist', userIds: [] } as Cohort;
        await getRepository(Cohort).delete({ name: cohortPayload.name });
        await cohortService.createCohort(cohortPayload);
        const cohort: Cohort = await getRepository(Cohort).findOne({ name: cohortPayload.name });

        await cohortService.addUsersToCohort(cohort.name, [firstUser.id, secondUser.id]);

        const updatedCohort: Cohort = await getRepository(Cohort).findOne({ name: cohortPayload.name });

        expect(updatedCohort.userIds).toHaveLength(2);
        expect(updatedCohort.userIds).toEqual(expect.arrayContaining([firstUser.id, secondUser.id]));
        expect(updatedCohort.updatedAt.toISOString()).not.toBe(updatedCohort.createdAt.toISOString());

        await getRepository(Cohort).delete({ name: cohortPayload.name });
        await removeUserByUsername(firstUserPayload.username);
        await removeUserByUsername(secondUserPayload.username);
    });
});
