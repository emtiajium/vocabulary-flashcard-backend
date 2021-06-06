import { Injectable, NotFoundException } from '@nestjs/common';
import CohortRepository from '@/user/repositories/CohortRepository';
import UserRepository from '@/user/repositories/UserRepository';
import * as _ from 'lodash';
import Cohort from '@/user/domains/Cohort';

@Injectable()
export default class CohortService {
    constructor(private readonly cohortRepository: CohortRepository, private readonly userRepository: UserRepository) {}

    async createCohort(cohort: Cohort): Promise<void> {
        await this.cohortRepository.insertIfNotExists(cohort);
    }

    async addUsersToCohort(name: string, userIds: string[]): Promise<void> {
        const cohort: Cohort = await this.cohortRepository.findOneOrFail({ name });
        const currentUserIdsBelongToCohort: string[] = cohort.userIds;
        await this.validateUsers(userIds, currentUserIdsBelongToCohort);
        await this.cohortRepository.updateUsersToCohort(cohort.id, _.union(currentUserIdsBelongToCohort, userIds));
        await Promise.all(userIds.map((userId) => this.userRepository.updateCohort(userId, cohort.id)));
    }

    private async validateUsers(userIds: string[], currentUserIdsBelongToCohort: string[]): Promise<void> {
        const users = await this.userRepository.getUsers(userIds);
        if (users.length !== userIds.length) {
            const nonExistingUsers = _.difference(userIds, currentUserIdsBelongToCohort);
            throw new NotFoundException(`There are no such users having IDs ${nonExistingUsers.join(', ')}`);
        }
    }
}
