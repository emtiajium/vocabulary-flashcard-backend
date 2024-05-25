import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import * as uuid from 'uuid';
import DataSource from '@/common/persistence/TypeormConfig';
import DeleteOldRandomDefinitionsJob from '@/vocabulary/jobs/DeleteOldRandomDefinitionsJob';
import GuessingGameRepository from '@/vocabulary/repositories/GuessingGameRepository';
import MomentUnit, { makeItOlder } from '@/common/utils/moment-util';

describe('DeleteOldRandomDefinitionsJob', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
    });

    afterAll(async () => {
        await app.get(GuessingGameRepository).clear();
        await app.close();
        await DataSource.destroy();
    });

    it('SHOULD not delete items not older than 15 days', async () => {
        // Arrange
        const oldRandomDefinitionsJob = app.get(DeleteOldRandomDefinitionsJob);
        const { generatedMaps } = await app.get(GuessingGameRepository).insert({
            userId: uuid.v4(),
            definitionId: uuid.v4(),
            createdAt: makeItOlder(new Date(), MomentUnit.DAYS, 3),
        });
        const id = generatedMaps[0].id;

        // Act
        await oldRandomDefinitionsJob.execute();

        // Assert
        const item = await app.get(GuessingGameRepository).findOneBy({ id });
        expect(item).toBeDefined();
    });

    it('SHOULD delete items older than 15 days', async () => {
        // Arrange
        const oldRandomDefinitionsJob = app.get(DeleteOldRandomDefinitionsJob);
        const { generatedMaps } = await app.get(GuessingGameRepository).insert({
            userId: uuid.v4(),
            definitionId: uuid.v4(),
            createdAt: makeItOlder(new Date(), MomentUnit.DAYS, 16),
        });
        const id = generatedMaps[0].id;

        // Act
        await oldRandomDefinitionsJob.execute();

        // Assert
        const item = await app.get(GuessingGameRepository).findOneBy({ id });
        expect(item).toBeNull();
    });
});
