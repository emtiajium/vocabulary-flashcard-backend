import { Injectable, NotFoundException } from '@nestjs/common';
import CohortRepository from '@/user/repositories/CohortRepository';
import UserRepository from '@/user/repositories/UserRepository';
import * as _ from 'lodash';
import Cohort from '@/user/domains/Cohort';

@Injectable()
export default class CohortService {
    constructor(private readonly cohortRepository: CohortRepository, private readonly userRepository: UserRepository) {}

    async createCohort(cohort: Cohort): Promise<void> {
        const isEmptyUsernames = cohort.usernames?.length === 0;
        if (!isEmptyUsernames) {
            await this.validateUsers(cohort.usernames);
        }
        await this.cohortRepository.insertIfNotExists(cohort);
        if (!isEmptyUsernames) {
            await this.associateUsersWithCohort(
                cohort.usernames,
                await this.cohortRepository.getCohortByName(cohort.name),
            );
        }
    }

    async addUsersToCohort(name: string, usernames: string[]): Promise<void> {
        const cohort: Cohort = await this.cohortRepository.getCohortByName(name);
        await this.validateUsers(usernames);
        await this.associateUsersWithCohort(usernames, cohort);
        // TODO move all vocabularies to the cohort
    }

    private getUsersNotFoundExceptionMessage = (nonExistingUsers: string[]): string => {
        const isSingular = nonExistingUsers.length === 1;
        return `There ${isSingular ? 'is' : 'are'} no such ${isSingular ? 'user' : 'users'} having ${
            isSingular ? 'username' : 'usernames'
        } ${nonExistingUsers.join(', ')}`;
    };

    private async validateUsers(usernames: string[]): Promise<void> {
        const users = await this.userRepository.getUsersByUsernames(usernames);
        if (users.length !== usernames.length) {
            const nonExistingUsers = _.difference(usernames, _.map(users, 'username'));
            throw new NotFoundException(this.getUsersNotFoundExceptionMessage(nonExistingUsers));
        }
    }

    private async associateUsersWithCohort(usernames: string[], cohort): Promise<void> {
        await this.userRepository.updateCohort(usernames, cohort.id);
    }

    findCohortById(id: string): Promise<Cohort> {
        return this.cohortRepository.findCohortById(id);
    }
}
