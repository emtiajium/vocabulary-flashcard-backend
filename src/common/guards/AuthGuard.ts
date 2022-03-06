import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { decode, JwtPayload } from 'jsonwebtoken';

type ExtendedUser = JwtPayload & User;

@Injectable()
export default class AuthGuard implements CanActivate {
    constructor(private readonly userService: UserService) {}

    private getHeaders = (request: Request): Record<string, unknown> => {
        return request.headers;
    };

    private getAuthorization(request: Request): string {
        return this.getHeaders(request)['Authorization'.toLowerCase()] as string;
    }

    private getJwToken(request: Request): string {
        const authorizationHeader = this.getAuthorization(request);
        if (!authorizationHeader) {
            throw new ForbiddenException();
        }
        const expectedLength = 2;
        const authorizationParts = authorizationHeader.split('Bearer ');
        if (!authorizationParts || authorizationParts?.length !== expectedLength) {
            throw new ForbiddenException();
        }
        return authorizationParts[1];
    }

    private extractUsername = (extendedUser: ExtendedUser): string => {
        // `email` is supposed to be come from the Google API
        if (!extendedUser?.username && !extendedUser?.email) {
            throw new ForbiddenException();
        }
        return extendedUser.username || extendedUser.email;
    };

    private decodeJwToken(token: string): ExtendedUser {
        let extendedUser: ExtendedUser;
        try {
            extendedUser = decode(token, { json: true }) as ExtendedUser;
            extendedUser.username = this.extractUsername(extendedUser);
        } catch {
            throw new ForbiddenException();
        }
        return extendedUser;
    }

    private getUsernameFromToken(request: Request): string {
        return this.decodeJwToken(this.getJwToken(request))?.username;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        let isValidUser: boolean;
        try {
            const user: User = await this.userService.getUserByUsername(this.getUsernameFromToken(request));
            isValidUser = !!user;
            request.user = user;
        } catch {
            isValidUser = false;
        }
        return isValidUser;
    }
}
