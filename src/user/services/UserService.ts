import { Injectable } from '@nestjs/common';
import UserRepository from '@/user/repositories/UserRepository';
import User from '@/user/domains/User';
import CohortService from '@/user/services/CohortService';
import EntityNotFoundException from '@/exceptions/EntityNotFoundException';

@Injectable()
export default class UserService {
    constructor(private readonly userRepository: UserRepository, private readonly cohortService: CohortService) {}

    async createUser(user: User): Promise<User> {
        const createdUser = await this.userRepository.insertAndUpdateIfExist(user);
        if (createdUser.version === 1) {
            await this.cohortService.createCohort({ name: user.username, usernames: [createdUser.username] });
        }
        return this.getUserByUsername(user.username);
    }

    async getUserByUsername(username: string): Promise<User> {
        const user = await this.userRepository.findOne({ username });
        if (!user) {
            throw new EntityNotFoundException(`User with username "${username}" does not exist`);
        }
        return user;
    }
}
