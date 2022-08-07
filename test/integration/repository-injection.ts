import User from '@/user/domains/User';
import { INestApplication } from '@nestjs/common';
import { kickOff } from '@/bootstrap';
import AppModule from '@/AppModule';
import UserRepository from '@/user/repositories/UserRepository';
import getUserByUsername, { removeUserByUsername } from '@test/util/user-util';

describe('Repository Injection', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await kickOff(AppModule);
    });

    afterAll(async () => {
        await app.close();
    });

    it('SHOULD insert a user', async () => {
        const user: User = {
            username: 'example40@gibberish.com',
            firstname: 'John',
            lastname: 'Doe',
        } as User;

        const userRepository = app.get<UserRepository>(UserRepository);

        await expect(userRepository.upsert(user)).resolves.toBeDefined();
        await expect(getUserByUsername(user.username)).resolves.toBeDefined();

        await removeUserByUsername(user.username);
    });
});
