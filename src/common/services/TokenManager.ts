import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import User from '@/user/domains/User';
import safeStringify from 'fast-safe-stringify';
import { createHash, randomBytes } from 'node:crypto';
import { accessTokenMinutes } from '@/user/domains/AuthSession';
import { compactVerify, createRemoteJWKSet } from 'jose';

export type DecodedToken = TokenPayload | (Partial<User> & { email: string; googleSubject: string });
export type AccessClaims = JwtPayload & {
    sub: string;
    sid: string;
    typ: 'access';
};

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

@Injectable()
export default class TokenManager {
    private readonly oAuth2Client: OAuth2Client;

    private readonly oAuth2ClientId: string;

    private readonly jwtSecret: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {
        this.jwtSecret = this.configService.get('APP_JWT_SECRET');
        this.oAuth2ClientId = this.configService.get('GOOGLE_AUTH_CLIENT_ID');
        this.oAuth2Client = new OAuth2Client(this.oAuth2ClientId);
    }

    createAccessToken(email: string, sessionId: string): string {
        return sign(
            {
                typ: 'access',
                sid: sessionId,
                email,
            },
            this.jwtSecret,
            {
                subject: email,
                issuer: 'firecracker-api',
                audience: 'firecracker-client',
                algorithm: 'HS256',
                expiresIn: `${accessTokenMinutes}m`,
            },
        );
    }

    createRefreshToken(): string {
        const randomByteSize = 32;
        return randomBytes(randomByteSize).toString('base64url');
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
            throw new UnauthorizedException('Invalid access token');
        }

        return claims;
    }

    // eslint-disable-next-line complexity
    async legacyVerifyAccessToken(token: string): Promise<DecodedToken> {
        try {
            // Verify the signature against Google's public keys.
            const { payload: verifiedBytes, protectedHeader } = await compactVerify(token, googleJwks);

            if (protectedHeader.alg !== 'RS256') {
                return Promise.reject(new UnauthorizedException('Invalid Google algorithm'));
            }

            const payload = JSON.parse(Buffer.from(verifiedBytes).toString('utf8')) as TokenPayload;

            // Verify Google issuer.
            if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
                return Promise.reject(new UnauthorizedException('Invalid Google issuer'));
            }

            // Verify that Google issued the token for our application.
            if (payload.aud !== this.oAuth2ClientId) {
                return Promise.reject(new UnauthorizedException('Invalid Google audience'));
            }

            if (!payload.sub || !payload.email || !payload.email_verified) {
                return Promise.reject(new UnauthorizedException('Invalid Google identity'));
            }

            return {
                ...payload,
                googleSubject: payload.sub,
            };
        } catch {
            throw new UnauthorizedException('Invalid Google token');
        }
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

    private handleTokenDecodingException(error: unknown): void {
        this.logger.error(`Error while verifying the token`, error instanceof Error ? safeStringify(error) : error);
        throw new UnauthorizedException();
    }

    extractUsername = (accessClaims: AccessClaims | DecodedToken): string => {
        if (!accessClaims?.email) {
            throw new UnauthorizedException();
        }
        return accessClaims.email;
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
