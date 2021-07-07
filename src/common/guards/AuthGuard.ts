import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { decode, JwtPayload } from 'jsonwebtoken';

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

    private decodeJwToken = (token: string): JwtPayload => {
        let jwtPayload: JwtPayload;
        try {
            jwtPayload = decode(token, { json: true });
            if (!jwtPayload) {
                throw new ForbiddenException();
            }
        } catch {
            throw new ForbiddenException();
        }
        return jwtPayload;
    };

    private getUsernameFromToken(request: Request): string {
        return this.decodeJwToken(this.getJwToken(request)).email;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        let isValidUser: boolean;
        try {
            const user: User = await this.userService.getUserByUsername(await this.getUsernameFromToken(request));
            request.user = user;
            isValidUser = !!user;
        } catch {
            isValidUser = false;
        }
        return isValidUser;
    }
}
