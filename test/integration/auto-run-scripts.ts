import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import { INestApplication } from '@nestjs/common';
import AutoRunScripts from '@/auto-run-scripts';

describe('Autorun Scripts', () => {
    let app: INestApplication;

    let mockRunScripts: jest.SpyInstance;

    beforeAll(async () => {
        app = await kickOff(AppModule);
    });

    afterAll(async () => {
        mockRunScripts.mockRestore();
        await app.close();
    });

    it('SHOULD execute the autorun scripts', async () => {
        mockRunScripts = jest.spyOn(AutoRunScripts.prototype, 'runScripts').mockImplementation(() => Promise.resolve());

        await new AutoRunScripts(app).runScripts();

        expect(mockRunScripts).toHaveBeenCalled();
    });
});
