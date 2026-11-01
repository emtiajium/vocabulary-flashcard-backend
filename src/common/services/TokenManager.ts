import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { decode, JwtPayload, sign, verify } from 'jsonwebtoken';
import User from '@/user/domains/User';
import safeStringify from 'fast-safe-stringify';
import { createHash, randomBytes } from 'node:crypto';

export type DecodedToken = TokenPayload | (Partial<User> & { email: string; googleSubject: string });
export type AccessClaims = JwtPayload & {
    sub: string;
    sid: string;
    typ: 'access';
};

@Injectable()
export default class TokenManager {
    private readonly oAuth2Client: OAuth2Client;

    private readonly oAuth2ClientId: string;

    private readonly jwtSecret: string;

    private readonly isAutomatedTestingEnvironment: boolean;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {
        this.isAutomatedTestingEnvironment = this.configService.get('SERVICE_ENV') === 'test';
        this.jwtSecret = this.configService.get('APP_JWT_SECRET');
        this.oAuth2ClientId = this.configService.get('GOOGLE_AUTH_CLIENT_ID');
        this.oAuth2Client = new OAuth2Client(this.oAuth2ClientId);
    }

    createAccessToken(userId: string, sessionId: string): string {
        return sign({ typ: 'access', sid: sessionId }, this.jwtSecret, {
            subject: userId,
            issuer: 'firecracker-api',
            audience: 'firecracker-client',
            algorithm: 'HS256',
            expiresIn: '15m',
        });
    }

    createRefreshToken(): string {
        // eslint-disable-next-line no-magic-numbers
        return randomBytes(32).toString('base64url');
    }

    hashRefreshToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    verifyAccessToken(token: string): AccessClaims {
        const claims = verify(token, this.jwtSecret, {
            algorithms: ['HS256'],
            issuer: 'firecracker-api',
            audience: 'firecracker-client',
        }) as AccessClaims;

        if (claims.typ !== 'access' || typeof claims.sub !== 'string' || typeof claims.sid !== 'string') {
            throw new ForbiddenException('Invalid access token');
        }

        return claims;
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

    // eslint-disable-next-line complexity
    async decodeViaGoogle(token: string): Promise<DecodedToken> {
        const loginTicket = await this.oAuth2Client.verifyIdToken({
            idToken: token,
            audience: this.oAuth2ClientId,
        });
        const payload = loginTicket.getPayload();
        if (!payload?.sub || !payload.email || !payload.email_verified) {
            throw new UnauthorizedException('Invalid Google identity');
        }
        return {
            ...payload,
            googleSubject: payload.sub,
        };
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
