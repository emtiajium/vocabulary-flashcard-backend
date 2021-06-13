import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import AutoRunScripts from '@/auto-run-scripts';

describe('Autorun Scripts', () => {
    let app: INestApplication;

    let mockRunScripts;

    beforeAll(async () => {
        app = await bootstrap(AppModule);
    });

    afterAll(async () => {
        mockRunScripts.restoreMock();
        await app.close();
    });

    it('SHOULD execute the autorun scripts', async () => {
        mockRunScripts = jest.spyOn(AutoRunScripts.prototype, 'runScripts').mockImplementation(() => Promise.resolve());

        await new AutoRunScripts(app).runScripts();

        expect(mockRunScripts).toHaveBeenCalled();
    });
});
