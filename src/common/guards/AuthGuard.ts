import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

// fake auth guard
// should be validated using JWT token

@Injectable()
export default class AuthGuard implements CanActivate {
    constructor(private readonly userService: UserService) {}

    private getHeaders = (request: Request): Record<string, unknown> => {
        return request.headers;
    };

    private getUserId(request: Request): string {
        return this.getHeaders(request)['X-User-Id'.toLowerCase()] as string;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        let isValidUser: boolean;
        try {
            const user: User = await this.userService.getUserById(this.getUserId(request));
            request.user = user;
            isValidUser = !!user;
        } catch {
            isValidUser = false;
        }
        return isValidUser;
    }
}
