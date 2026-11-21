import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import TokenManager, { AccessClaims } from '@/common/services/TokenManager';
import { getAccessToken, getClient } from '@/common/http/util';
import ClientType from '@/common/domains/ClientType';

@Injectable()
export default class AuthGuard implements CanActivate {
    constructor(
        private readonly userService: UserService,
        private readonly tokenManager: TokenManager,
    ) {}

    private async decodeAccessToken(request: Request): Promise<AccessClaims> {
        const token = getAccessToken(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        if (getClient(request) === ClientType.ANDROID_NATIVE) {
            return this.tokenManager.legacyVerifyAccessToken(token);
        }
        return this.tokenManager.verifyAccessToken(token);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        let isValidUser: boolean;
        try {
            const decodedToken = await this.decodeAccessToken(request);
            const username = this.tokenManager.extractUsername(decodedToken);
            const user: User = await this.userService.getUserByUsername(username);
            isValidUser = Boolean(user);
            request.user = user;
        } catch {
            isValidUser = false;
        }

        // When a NestJS guard returns false, Nest normally responds with 403 Forbidden, not 401 Unauthorized
        if (!isValidUser) {
            throw new UnauthorizedException();
        }

        return true;
    }
}
