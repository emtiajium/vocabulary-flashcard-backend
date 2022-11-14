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
import { ConfigService } from '@nestjs/config';
import TokenManager from '@/common/services/TokenManager';
import ClientType from '@/common/domains/ClientType';

@Injectable()
export default class UserService {
    // eslint-disable-next-line max-params
    constructor(
        private readonly userRepository: UserRepository,
        private readonly cohortService: CohortService,
        private readonly leitnerSystemsRepository: LeitnerSystemsRepository,
        private readonly configService: ConfigService,
        private readonly tokenManager: TokenManager,
    ) {}

    async createUser(userPayload: User, token: string, client: ClientType, versionCode: number): Promise<User> {
        const user = await this.assertUserCreationPayload(userPayload, token, client, versionCode);
        const persistedUser = await this.userRepository.upsert(user);
        if (persistedUser.version === 1) {
            await this.cohortService.createCohort({ name: user.username, usernames: [persistedUser.username] });
        }
        return this.getUserByUsername(user.username);
    }

    private validateUserCreationToken(token: string, client: ClientType, versionCode: number): void {
        if (!token) {
            if (client === ClientType.WEB) {
                throw new ForbiddenException();
            }
            const androidVersion = 69;
            // client = ClientType.ANDROID_NATIVE
            if (versionCode >= androidVersion) {
                throw new ForbiddenException();
            }
        }
    }

    private async assertUserCreationPayload(
        userPayload: User,
        token: string,
        client: ClientType,
        versionCode: number,
    ): Promise<User> {
        this.validateUserCreationToken(token, client, versionCode);
        let user = userPayload;
        if (token) {
            const decodedToken = await this.tokenManager.decodeJwTokenV2(token);
            user = this.tokenManager.getUser(decodedToken);
        }
        return user;
    }

    async getUserByUsername(username: string): Promise<User> {
        const user = await this.userRepository.findOne({ username });
        if (!user) {
            throw new EntityNotFoundException(`User with username "${username}" does not exist`);
        }
        return user;
    }

    private validateReportGeneration(secret: string): void {
        if (secret !== this.configService.get('GENERATING_REPORT_SECRET')) {
            throw new ForbiddenException();
        }
    }

    async getAll(secret: string): Promise<SearchResult<UserReport>> {
        this.validateReportGeneration(secret);
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

    getLeitnerLoverUsers(secret: string): Promise<LeitnerSystemsLoverUsersReport[]> {
        this.validateReportGeneration(secret);

        return this.leitnerSystemsRepository.getLeitnerLoverUsers();
    }
}
