import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import TokenManager, { DecodedToken } from '@/common/services/TokenManager';
import { getJwToken } from '@/common/http/util';

@Injectable()
export default class AuthGuard implements CanActivate {
    constructor(
        private readonly userService: UserService,
        private readonly tokenManager: TokenManager,
    ) {}

    private async decodeJwToken(request: Request): Promise<DecodedToken> {
        const token = getJwToken(request);
        if (!token) {
            throw new ForbiddenException();
        }
        return this.tokenManager.decodeJwToken(token);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        let isValidUser: boolean;
        try {
            const decodedToken = await this.decodeJwToken(request);
            const username = this.tokenManager.extractUsername(decodedToken);
            const user: User = await this.userService.getUserByUsername(username);
            isValidUser = Boolean(user);
            request.user = user;
        } catch {
            isValidUser = false;
        }
        return isValidUser;
    }
}
