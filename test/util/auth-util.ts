import User from '@/user/domains/User';
import { sign, Algorithm } from 'jsonwebtoken';
import * as fs from 'fs';
import { classToPlain } from 'class-transformer';
import { ConfigService } from '@nestjs/config';

// to encode a jwt: https://jwt.io/
// to generate a private key: https://dinochiesa.github.io/jwt/
// Google generated jwt details: https://developers.google.com/identity/gsi/web/reference/js-reference

export default function generateJwToken(user: User): string {
    const plainUser = classToPlain({
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
    // https://github.com/nodejs/node/issues/43132#issuecomment-1131856552
    return sign(plainUser, privateKey, {
        algorithm,
        expiresIn: '5m',
        audience: new ConfigService().get('GOOGLE_AUTH_CLIENT_ID'),
        issuer: 'accounts.google.com',
    });
}
