import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import AutoRunScripts from '@/auto-run-scripts';
import getCohortByName from '@test/util/cohort-util';
import { defaultName } from '@/user/domains/Cohort';

describe('Create Default Cohort Autorun Script', () => {
    let app: INestApplication;

    let mockGetScriptNames: jest.SpyInstance;

    beforeAll(async () => {
        app = await kickOff(AppModule);
    });

    afterAll(async () => {
        mockGetScriptNames.mockRestore();
        await app.close();
    });

    it('SHOULD execute the autorun scripts', async () => {
        mockGetScriptNames = jest
            .spyOn(AutoRunScripts.prototype, 'getScriptNames')
            .mockImplementation(() => Promise.resolve(['1623557103708-create-default-cohort.ts']));

        await new AutoRunScripts(app).runScripts();

        const defaultCohort = await getCohortByName(defaultName);
        expect(defaultCohort.name).toBe(defaultName);
        expect(defaultCohort.id).toBeDefined();
    });
});
