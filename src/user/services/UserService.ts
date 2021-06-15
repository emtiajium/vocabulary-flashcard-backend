import { Injectable } from '@nestjs/common';
import UserRepository from '@/user/repositories/UserRepository';
import User from '@/user/domains/User';

@Injectable()
export default class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async createUser(user: User): Promise<User> {
        // TODO associate with a brand new Cohort (name = username)
        return this.userRepository.insertAndUpdateIfExist(user);
    }

    async getUserByUsername(username: string): Promise<User> {
        return this.userRepository.findOne({ username });
    }
}
