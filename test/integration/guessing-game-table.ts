import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import DataSource from '@/common/persistence/TypeormConfig';
import GuessingGameRepository from '@/vocabulary/repositories/GuessingGameRepository';

describe('UNLOGGED GuessingGame Table', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
    });

    afterAll(async () => {
        await app.close();
        await DataSource.destroy();
    });

    test('GuessingGame SHOULD be UNLOGGED table', async () => {
        // Act
        const queryResponse = await app.get(GuessingGameRepository).query(`
            select relpersistence
            from pg_class
            where relname = 'GuessingGame';
        `);

        // Assert
        expect(queryResponse[0].relpersistence).toBe('u');
    });
});
