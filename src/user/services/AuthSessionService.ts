import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { randomUUID } from 'node:crypto';
import AuthSession, { refreshMaxAge } from '@/user/domains/AuthSession';
import AuthSessionRepository from '@/user/repositories/AuthSessionRepository';
import TokenManager from '@/common/services/TokenManager';

@Injectable()
export class AuthSessionService {
    constructor(
        private readonly authSessionRepository: AuthSessionRepository,
        private readonly tokenManager: TokenManager,
    ) {}

    async create(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
        const refreshToken = this.tokenManager.createRefreshToken();

        const session = this.authSessionRepository.create({
            id: randomUUID(),
            userId,
            username: email,
            refreshTokenHash: this.tokenManager.hashRefreshToken(refreshToken),
            expiresAt: new Date(Date.now() + refreshMaxAge),
        });

        await this.authSessionRepository.insert(session);

        return {
            accessToken: this.tokenManager.createAccessToken(email, session.id),
            refreshToken,
        };
    }

    async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const oldHash = this.tokenManager.hashRefreshToken(refreshToken);
        const newToken = this.tokenManager.createRefreshToken();
        const newHash = this.tokenManager.hashRefreshToken(newToken);
        const now = new Date();

        // Atomic compare-and-swap: only one concurrent refresh wins.
        const result = await this.authSessionRepository
            .createQueryBuilder()
            .update(AuthSession)
            .set({
                refreshTokenHash: newHash,
                lastUsedAt: now,
            })
            .where('refreshTokenHash = :oldHash', { oldHash })
            .andWhere('revokedAt IS NULL')
            .andWhere('expiresAt > :now', { now })
            .returning(['id', 'username'])
            .execute();

        if (result.affected !== 1) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const session = result.raw[0] as {
            id: string;
            username: string;
        };

        return {
            accessToken: this.tokenManager.createAccessToken(session.username, session.id),
            refreshToken: newToken,
        };
    }

    async revoke(refreshToken: string): Promise<void> {
        await this.authSessionRepository.update(
            {
                refreshTokenHash: this.tokenManager.hashRefreshToken(refreshToken),
                revokedAt: IsNull(),
            },
            { revokedAt: new Date() },
        );
    }
}
