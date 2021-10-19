import { Injectable } from '@nestjs/common';
import UserRepository from '@/user/repositories/UserRepository';
import User from '@/user/domains/User';
import CohortService from '@/user/services/CohortService';
import EntityNotFoundException from '@/exceptions/EntityNotFoundException';
import * as _ from 'lodash';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import UserReport from '@/user/domains/UserReport';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';

@Injectable()
export default class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly cohortService: CohortService,
        private readonly leitnerSystemsRepository: LeitnerSystemsRepository,
    ) {}

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

    async getAll(): Promise<UserReport[]> {
        const users = await this.userRepository.getAll();
        return _.map(users, (user) => _.pick(user, ['username', 'name', 'cohortName']));
    }

    getLeitnerLoverUsers(): Promise<LeitnerSystemsLoverUsersReport[]> {
        return this.leitnerSystemsRepository.getLeitnerLoverUsers();
    }
}
