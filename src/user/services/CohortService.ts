import { Injectable, NotFoundException } from '@nestjs/common';
import CohortRepository from '@/user/repositories/CohortRepository';
import UserRepository from '@/user/repositories/UserRepository';
import * as _ from 'lodash';
import Cohort from '@/user/domains/Cohort';
import User from '@/user/domains/User';
import VocabularyService from '@/vocabulary/services/VocabularyService';

@Injectable()
export default class CohortService {
    constructor(
        private readonly cohortRepository: CohortRepository,
        private readonly userRepository: UserRepository,
        private readonly vocabularyService: VocabularyService,
    ) {}

    async createCohort(cohort: Cohort): Promise<void> {
        const isEmptyUsernames = cohort.usernames?.length === 0;
        if (!isEmptyUsernames) {
            await this.assertUsers(cohort.usernames);
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
        const users = await this.assertUsers(usernames);
        await this.associateUsersWithCohort(usernames, cohort);

        let cohortIds: string[] = [];
        users.forEach((user) => {
            if (user.cohortId) {
                cohortIds.push(user.cohortId);
            }
        });
        cohortIds = _.uniq(cohortIds);

        if (!_.isEmpty(cohortIds)) {
            // I want to make sure they execute synchronously
            // eslint-disable-next-line no-restricted-syntax
            for (const cohortId of cohortIds) {
                // eslint-disable-next-line no-await-in-loop
                await this.vocabularyService.updateCohort(cohortId, cohort.id);
            }
        }
    }

    private getUsersNotFoundExceptionMessage = (nonExistingUsers: string[]): string => {
        const isSingular = nonExistingUsers.length === 1;
        return `There ${isSingular ? 'is' : 'are'} no such ${isSingular ? 'user' : 'users'} having ${
            isSingular ? 'username' : 'usernames'
        } ${nonExistingUsers.join(', ')}`;
    };

    private async assertUsers(usernames: string[]): Promise<User[]> {
        const users = await this.userRepository.getUsersByUsernames(usernames);
        if (users.length !== usernames.length) {
            const nonExistingUsers = _.difference(usernames, _.map(users, 'username'));
            throw new NotFoundException(this.getUsersNotFoundExceptionMessage(nonExistingUsers));
        }
        return users;
    }

    private async associateUsersWithCohort(usernames: string[], cohort): Promise<void> {
        await this.userRepository.updateCohort(usernames, cohort.id);
    }

    findCohortById(id: string): Promise<Cohort> {
        return this.cohortRepository.findCohortById(id);
    }
}
