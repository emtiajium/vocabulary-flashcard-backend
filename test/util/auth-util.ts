import User from '@/user/domains/User';
import { sign, Algorithm } from 'jsonwebtoken';
import * as fs from 'fs';
import { classToPlain } from 'class-transformer';

export default function generateJwToken(user: User): string {
    const plainUser = classToPlain(user);
    const algorithm: Algorithm = 'RS256';
    const privateKey = fs.readFileSync(`${process.cwd()}/test/private.key`);
    return sign(plainUser, privateKey, { algorithm, expiresIn: '1h' });
}
