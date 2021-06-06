import { Injectable, NotFoundException } from '@nestjs/common';
import CohortRepository from '@/user/repositories/CohortRepository';
import UserRepository from '@/user/repositories/UserRepository';
import * as _ from 'lodash';
import Cohort from '@/user/domains/Cohort';

@Injectable()
export default class CohortService {
    constructor(private readonly cohortRepository: CohortRepository, private readonly userRepository: UserRepository) {}

    async createCohort(cohort: Cohort): Promise<void> {
        const isEmptyUserIds = cohort?.userIds.length === 0;
        if (!isEmptyUserIds) {
            await this.validateUsers(cohort.userIds);
        }
        await this.cohortRepository.insertIfNotExists(cohort);
        if (!isEmptyUserIds) {
            await this.tagUsersWithCohort(cohort.userIds, await this.cohortRepository.getCohortByName(cohort.name));
        }
    }

    async addUsersToCohort(name: string, userIds: string[]): Promise<void> {
        const cohort: Cohort = await this.cohortRepository.getCohortByName(name);
        const currentUserIdsBelongToCohort: string[] = cohort.userIds;
        await this.validateUsers(userIds);
        await this.cohortRepository.updateUsersToCohort(cohort.id, _.union(currentUserIdsBelongToCohort, userIds));
        await this.tagUsersWithCohort(userIds, cohort);
    }

    private async validateUsers(userIds: string[]): Promise<void> {
        const users = await this.userRepository.getUsers(userIds);
        if (users.length !== userIds.length) {
            const nonExistingUsers = _.difference(userIds, _.map(users, 'id'));
            throw new NotFoundException(`There are no such users having IDs ${nonExistingUsers.join(', ')}`);
        }
    }

    private async tagUsersWithCohort(userIds: string[], cohort): Promise<void> {
        await Promise.all(userIds.map((userId) => this.userRepository.updateCohort(userId, cohort.id)));
    }
}
