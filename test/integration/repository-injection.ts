import User from '@/user/domains/User';
import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import UserRepository from '@/user/repositories/UserRepository';
import getUserByUsername, { generateUsername, removeUsersByUsernames } from '@test/util/user-util';
import DataSource from '@/common/persistence/TypeormConfig';

describe('Repository Injection', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await kickOff(AppModule);
        await DataSource.initialize();
    });

    afterAll(async () => {
        await app.close();
        await DataSource.destroy();
    });

    it('SHOULD insert a user', async () => {
        const user: User = {
            username: generateUsername(),
            firstname: 'John',
            lastname: 'Doe',
        } as User;

        const userRepository = app.get<UserRepository>(UserRepository);

        await expect(userRepository.upsertII(user)).resolves.toBeDefined();
        await expect(getUserByUsername(user.username)).resolves.toBeDefined();

        await removeUsersByUsernames([user.username]);
    });
});
