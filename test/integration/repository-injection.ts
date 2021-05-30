import { getRepository } from 'typeorm';
import User from '@/user/domains/User';
import { INestApplication } from '@nestjs/common';
import bootstrap from '@/bootstrap';
import AppModule from '@/AppModule';
import UserRepository from '@/user/repositories/UserRepository';

describe('Repository Injection', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await bootstrap(AppModule);
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
        await expect(userRepository.insertIfNotExists(user)).resolves.toBeDefined();
        await expect(getRepository(User).findOne({ username: user.username })).resolves.toBeDefined();
        await getRepository(User).delete({ username: user.username });
    });
});
