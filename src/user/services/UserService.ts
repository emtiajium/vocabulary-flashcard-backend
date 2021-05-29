import { Injectable } from '@nestjs/common';
import UserRepository from '@/user/repositories/UserRepository';
import User from '@/user/domains/User';

@Injectable()
export default class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async createUser(user: User): Promise<void> {
        await this.userRepository.insertIfNotExists(user);
    }
}
