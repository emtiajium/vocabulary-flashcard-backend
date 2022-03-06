import { getRepository } from 'typeorm';
import User from '@/user/domains/User';
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
        await expect(getRepository(User).findOne()).resolves.not.toBeNull();
    });
});
