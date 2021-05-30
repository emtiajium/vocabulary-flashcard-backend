import { Injectable } from '@nestjs/common';
import UserRepository from '@/user/repositories/UserRepository';
import User from '@/user/domains/User';

@Injectable()
export default class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async createUser(user: User): Promise<User> {
        return this.userRepository.insertIfNotExists(user);
    }

    async getUserByUsername(username: string): Promise<User> {
        return this.userRepository.findOne({ username });
    }
}
