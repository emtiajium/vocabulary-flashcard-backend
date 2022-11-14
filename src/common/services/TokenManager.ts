import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import User from '@/user/domains/User';
import safeStringify from 'fast-safe-stringify';

export type DecodedToken = TokenPayload | (Partial<User> & { email: string });

@Injectable()
export default class TokenManager {
    private readonly oAuth2Client: OAuth2Client;

    private readonly oAuth2ClientId: string;

    private readonly isAutomatedTestingEnvironment: boolean;

    constructor(private readonly configService: ConfigService, private readonly logger: Logger) {
        this.logger.setContext(TokenManager.name);
        this.isAutomatedTestingEnvironment = this.configService.get('SERVICE_ENV') === 'test';
        this.oAuth2ClientId = this.configService.get('GOOGLE_AUTH_CLIENT_ID');
        this.oAuth2Client = new OAuth2Client(this.oAuth2ClientId);
    }

    private isEligibleToLegacyTokenVerification(): boolean {
        return true;
        // return this.isAutomatedTestingEnvironment;
    }

    async decodeJwTokenV2(token: string): Promise<DecodedToken> {
        let decodedToken: DecodedToken;
        try {
            decodedToken = await this.decodeViaGoogle(token);
        } catch (error) {
            this.handleTokenDecodingException(error);
        }
        return decodedToken;
    }

    private async decodeViaGoogle(token: string): Promise<DecodedToken> {
        const loginTicket = await this.oAuth2Client.verifyIdToken({
            idToken: token,
            audience: this.oAuth2ClientId,
        });
        return loginTicket.getPayload();
    }

    private handleTokenDecodingException(error: Error | string): void {
        this.logger.error(`Error while verifying the token`, error instanceof Error ? safeStringify(error) : error);
        throw new ForbiddenException();
    }

    async decodeJwToken(token: string): Promise<DecodedToken> {
        let decodedToken: DecodedToken;

        try {
            decodedToken = this.isEligibleToLegacyTokenVerification()
                ? (decode(token, { json: true }) as DecodedToken)
                : await this.decodeViaGoogle(token);
        } catch (error) {
            this.handleTokenDecodingException(error);
        }

        return decodedToken;
    }

    extractUsername = (decodedToken: DecodedToken): string => {
        if (!decodedToken?.email) {
            throw new ForbiddenException();
        }
        return decodedToken.email;
    };

    getUser(decodedToken: DecodedToken): User {
        const user = new User();
        user.username = (decodedToken as TokenPayload).email;
        user.firstname = (decodedToken as TokenPayload).given_name;
        user.lastname = (decodedToken as TokenPayload).family_name;
        user.profilePictureUrl = (decodedToken as TokenPayload).picture;
        return user;
    }
}
