import { getConnection } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';

describe('Database Connection', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await kickOff(AppModule);
    });

    afterAll(async () => {
        await app.close();
    });

    it('SHOULD be connected with the Database', async () => {
        await expect(getConnection().query(`SELECT 1 + 1 AS two;`)).resolves.toStrictEqual([{ two: 2 }]);
    });
});
