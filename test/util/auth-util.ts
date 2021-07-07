import User from '@/user/domains/User';
import { sign, Algorithm } from 'jsonwebtoken';
import * as fs from 'fs';
import { classToPlain } from 'class-transformer';

// to encode a jwt: https://jwt.io/
// to generate a private key: https://dinochiesa.github.io/jwt/

export default function generateJwToken(user: User): string {
    const plainUser = classToPlain(user);
    const algorithm: Algorithm = 'RS256';
    const privateKey = fs.readFileSync(`${process.cwd()}/test/private.key`);
    return sign(plainUser, privateKey, { algorithm, expiresIn: '5m' });
}
