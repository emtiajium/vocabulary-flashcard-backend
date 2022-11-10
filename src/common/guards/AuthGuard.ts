import UserService from '@/user/services/UserService';
import User from '@/user/domains/User';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { decode } from 'jsonwebtoken';
import { isOlderThanCurrentMoment } from '@/common/utils/moment-util';

type DecodedToken = TokenPayload | (Partial<User> & { email: string });

@Injectable()
export default class AuthGuard implements CanActivate {
    private readonly oAuth2Client: OAuth2Client;

    private readonly oAuth2ClientId: string;

    private readonly isAutomatedTestingEnvironment: boolean;

    constructor(private readonly userService: UserService, private readonly configService: ConfigService) {
        this.isAutomatedTestingEnvironment = this.configService.get('SERVICE_ENV') === 'test';
        this.oAuth2ClientId = this.configService.get('GOOGLE_AUTH_CLIENT_ID');
        this.oAuth2Client = new OAuth2Client(this.oAuth2ClientId);
    }

    private getHeaders = (request: Request): Record<string, unknown> => {
        return request.headers;
    };

    private getAuthorization(request: Request): string {
        return this.getHeaders(request)['Authorization'.toLowerCase()] as string;
    }

    private isAndroid(request: Request): boolean {
        return (
            this.getHeaders(request)['x-requested-with'] === 'com.emtiajium.firecracker.collaborative.vocab.practice'
        );
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

    private extractUsername = (decodedToken: DecodedToken): string => {
        if (!decodedToken?.email) {
            throw new ForbiddenException();
        }
        return decodedToken.email;
    };

    private isEligibleToLegacyTokenVerification(request: Request): boolean {
        return (
            this.isAutomatedTestingEnvironment ||
            (this.isAndroid(request) && isOlderThanCurrentMoment(new Date(`2022-11-15T00:00:00.000Z`)))
        );
    }

    private async decodeJwToken(request: Request): Promise<DecodedToken> {
        const token = this.getJwToken(request);

        let decodedToken: DecodedToken;

        try {
            if (this.isEligibleToLegacyTokenVerification(request)) {
                decodedToken = decode(token, { json: true }) as DecodedToken;
            } else {
                const loginTicket = await this.oAuth2Client.verifyIdToken({
                    idToken: token,
                    audience: this.oAuth2ClientId,
                });
                decodedToken = loginTicket.getPayload();
            }
        } catch {
            throw new ForbiddenException();
        }

        return decodedToken;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        let isValidUser: boolean;
        try {
            const decodedToken = await this.decodeJwToken(request);
            const username = this.extractUsername(decodedToken);
            const user: User = await this.userService.getUserByUsername(username);
            isValidUser = !!user;
            request.user = user;
        } catch {
            isValidUser = false;
        }
        return isValidUser;
    }
}
