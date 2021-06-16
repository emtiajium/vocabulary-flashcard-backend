import { Injectable, NotFoundException } from '@nestjs/common';
import CohortRepository from '@/user/repositories/CohortRepository';
import UserRepository from '@/user/repositories/UserRepository';
import * as _ from 'lodash';
import Cohort from '@/user/domains/Cohort';

@Injectable()
export default class CohortService {
    constructor(private readonly cohortRepository: CohortRepository, private readonly userRepository: UserRepository) {}

    async createCohort(cohort: Cohort): Promise<void> {
        const isEmptyUserIds = cohort.userIds?.length === 0;
        if (!isEmptyUserIds) {
            await this.validateUsers(cohort.userIds);
        }
        await this.cohortRepository.insertIfNotExists(cohort);
        if (!isEmptyUserIds) {
            await this.associateUsersWithCohort(
                cohort.userIds,
                await this.cohortRepository.getCohortByName(cohort.name),
            );
        }
    }

    async addUsersToCohort(name: string, userIds: string[]): Promise<void> {
        const cohort: Cohort = await this.cohortRepository.getCohortByName(name);
        await this.validateUsers(userIds);
        await this.associateUsersWithCohort(userIds, cohort);
    }

    private async validateUsers(userIds: string[]): Promise<void> {
        const users = await this.userRepository.getUsers(userIds);
        if (users.length !== userIds.length) {
            const nonExistingUsers = _.difference(userIds, _.map(users, 'id'));
            const isSingular = nonExistingUsers.length === 1;
            throw new NotFoundException(
                `There ${isSingular ? 'is' : 'are'} no such ${isSingular ? 'user' : 'users'} having ${
                    isSingular ? 'ID' : 'IDs'
                } ${nonExistingUsers.join(', ')}`,
            );
        }
    }

    private async associateUsersWithCohort(userIds: string[], cohort): Promise<void> {
        await Promise.all(userIds.map((userId) => this.userRepository.updateCohort(userId, cohort.id)));
    }
}
