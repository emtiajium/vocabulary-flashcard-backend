import { ForbiddenException, Injectable } from '@nestjs/common';
import UserRepository from '@/user/repositories/UserRepository';
import User from '@/user/domains/User';
import CohortService from '@/user/services/CohortService';
import EntityNotFoundException from '@/common/exceptions/EntityNotFoundException';
import * as _ from 'lodash';
import LeitnerSystemsRepository from '@/vocabulary/repositories/LeitnerSystemsRepository';
import UserReport from '@/user/domains/UserReport';
import LeitnerSystemsLoverUsersReport from '@/user/domains/LeitnerSystemsLoverUsersReport';
import SearchResult from '@/common/domains/SearchResult';
import TokenManager from '@/common/services/TokenManager';
import CacheUserService from '@/user/services/CacheUserService';

@Injectable()
export default class UserService {
    // eslint-disable-next-line max-params
    constructor(
        private readonly userRepository: UserRepository,
        private readonly cohortService: CohortService,
        private readonly leitnerSystemsRepository: LeitnerSystemsRepository,
        private readonly tokenManager: TokenManager,
        private readonly cacheUserService: CacheUserService,
    ) {}

    async createUser(token: string): Promise<Pick<User, 'id' | 'username' | 'name' | 'profilePictureUrl'>> {
        const user = await this.assertUserCreationPayload(token);
        this.cacheUserService.delete(user.username);
        const persistedUser = await this.userRepository.insertOrUpdate(user);
        if (persistedUser.version === 1) {
            await this.cohortService.createCohort({ name: user.username, usernames: [persistedUser.username] });
        }
        return {
            id: persistedUser.id,
            username: persistedUser.username,
            name: persistedUser.name,
            profilePictureUrl: persistedUser.profilePictureUrl,
        };
    }

    private validateUserCreationToken(token: string): void {
        if (!token) {
            throw new ForbiddenException();
        }
    }

    private async assertUserCreationPayload(token: string): Promise<User> {
        this.validateUserCreationToken(token);
        const decodedToken = await this.tokenManager.decodeJwTokenV2(token);
        return this.tokenManager.getUser(decodedToken);
    }

    async getUserByUsername(username: string): Promise<User> {
        let user: User;
        user = this.cacheUserService.get(username);
        if (!user) {
            user = await this.userRepository.findOneBy({ username });
            if (user) {
                this.cacheUserService.set(user);
            }
        }
        if (!user) {
            throw new EntityNotFoundException(`User with username "${username}" does not exist`);
        }
        return user;
    }

    async getAll(): Promise<SearchResult<UserReport>> {
        const users = await this.userRepository.getAll();
        return new SearchResult<UserReport>(
            _.map(users, (user) => ({
                username: user.username,
                name: user.name,
                createdAt: user.createdAt,
                cohort: { name: user.cohort.name },
            })),
            users.length,
        );
    }

    getLeitnerLoverUsers(): Promise<LeitnerSystemsLoverUsersReport[]> {
        return this.leitnerSystemsRepository.getLeitnerLoverUsers();
    }

    getRecentlyActiveUsers(): Pick<User, 'username'>[] {
        const users = this.cacheUserService.getAll();
        return users.map((user) => {
            return {
                username: user.username,
            };
        });
    }
}
