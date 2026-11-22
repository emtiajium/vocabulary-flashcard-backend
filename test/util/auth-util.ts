import User from '@/user/domains/User';
import { sign, Algorithm } from 'jsonwebtoken';
import { instanceToPlain } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { v4 } from 'uuid';

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
    const privateKey = readFileSync(`${process.cwd()}/test/private.key`);
    return sign(plainUser, privateKey, {
        algorithm,
        expiresIn: '5m',
        audience: new ConfigService().get('GOOGLE_AUTH_CLIENT_ID'),
        issuer: 'accounts.google.com',
    });
}
