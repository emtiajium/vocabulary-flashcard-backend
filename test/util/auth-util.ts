import User from '@/user/domains/User';
import { sign, Algorithm } from 'jsonwebtoken';
import * as fs from 'fs';
import { instanceToPlain } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';

// to encode a jwt: https://jwt.io/

export default function generateJwToken(user: User): string {
    const plainUser = {
        email: user.username,
        typ: 'access',
        sid: v4(),
    };
    const algorithm: Algorithm = 'HS256';
    return sign(plainUser, new ConfigService().get('APP_JWT_SECRET'), {
        subject: user.username,
        issuer: 'firecracker-api',
        audience: 'firecracker-client',
        algorithm,
        expiresIn: '5m',
    });
}

// to generate a private key: https://dinochiesa.github.io/jwt/
// Google generated jwt details: https://developers.google.com/identity/gsi/web/reference/js-reference
export function generateGoogleProvidedToken(user: User): string {
    const plainUser = instanceToPlain({
        ...user,
        email: user.username,
        email_verified: true,
        given_name: user.firstname,
        family_name: user.lastname,
        name: user.name,
        picture: user.profilePictureUrl,
    });
    const algorithm: Algorithm = 'RS256';
    const privateKey = fs.readFileSync(`${process.cwd()}/test/private.key`);
    return sign(plainUser, privateKey, {
        algorithm,
        expiresIn: '5m',
        audience: new ConfigService().get('GOOGLE_AUTH_CLIENT_ID'),
        issuer: 'accounts.google.com',
    });
}
