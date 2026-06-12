import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import DataSource from '@/common/persistence/TypeormConfig';

describe('Database Connection', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
    });

    afterAll(async () => {
        await app.close();
        await DataSource.destroy();
    });

    it('SHOULD be connected with the Database', async () => {
        await expect(
            DataSource.query(/* sql */ `
                select
                    1 + 1 as two;
            `),
        ).resolves.toStrictEqual([{ two: 2 }]);
    });
});
