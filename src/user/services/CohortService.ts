import { Injectable, NotFoundException } from '@nestjs/common';
import CohortRepository from '@/user/repositories/CohortRepository';
import UserRepository from '@/user/repositories/UserRepository';
import * as _ from 'lodash';
import Cohort from '@/user/domains/Cohort';
import User from '@/user/domains/User';
import VocabularyService from '@/vocabulary/services/VocabularyService';
import CacheUserService from '@/user/services/CacheUserService';

@Injectable()
export default class CohortService {
    constructor(
        private readonly cohortRepository: CohortRepository,
        private readonly userRepository: UserRepository,
        private readonly vocabularyService: VocabularyService,
        private readonly cacheUserService: CacheUserService,
    ) {}

    async createCohort(cohort: Cohort): Promise<void> {
        const isEmptyUsernames = cohort.usernames?.length === 0;
        let users: User[] = [];
        if (!isEmptyUsernames) {
            users = await this.assertUsers(cohort.usernames);
        }
        const { id: cohortId } = await this.cohortRepository.insertIfNotExists(cohort);
        if (!isEmptyUsernames) {
            this.cacheUserService.deleteMultiples(cohort.usernames);
            await this.associateUsersWithCohort(cohort.usernames, cohortId);
            await this.associateVocabsWithCohort(users, cohortId);
        }
    }

    async addUsersToCohort(name: string, usernames: string[]): Promise<void> {
        const cohort = await this.cohortRepository.getCohortByName(name);
        const users = await this.assertUsers(usernames);
        this.cacheUserService.deleteMultiples(usernames);
        await this.associateUsersWithCohort(usernames, cohort.id);
        await this.associateVocabsWithCohort(users, cohort.id);
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

    private async associateUsersWithCohort(usernames: string[], cohortId: string): Promise<void> {
        await this.userRepository.updateCohort(usernames, cohortId);
    }

    private async associateVocabsWithCohort(users: User[], cohortId: string): Promise<void> {
        let currentCohortIds: string[] = [];

        users.forEach((user) => {
            if (user.cohortId) {
                currentCohortIds.push(user.cohortId);
            }
        });
        currentCohortIds = _.uniq(currentCohortIds);

        if (!_.isEmpty(currentCohortIds)) {
            // eslint-disable-next-line no-restricted-syntax
            for (const currentCohortId of currentCohortIds) {
                // I want to make sure they execute synchronously
                // eslint-disable-next-line no-await-in-loop
                await this.vocabularyService.updateCohort(currentCohortId, cohortId);
            }
        }
    }

    findCohortById(id: string): Promise<Cohort> {
        return this.cohortRepository.findCohortById(id);
    }
}
