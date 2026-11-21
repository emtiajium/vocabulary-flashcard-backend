import { Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthSessionService } from '@/user/services/AuthSessionService';
import { AuthCookieService } from '@/user/services/AuthCookieService';
import { RefreshAuthToken } from '@/common/http/AuthToken';
import { TokenResponse } from '@/user/domains/TokenResponse';
import AuthenticatedUser from '@/common/http/AuthenticatedUser';
import User from '@/user/domains/User';

@Controller('/v1/auth')
export class AuthController {
    constructor(
        private readonly authSessionService: AuthSessionService,
        private readonly authCookieService: AuthCookieService,
    ) {}

    @Post('/refresh')
    async refresh(
        @Res({ passthrough: true }) response: Response,
        @RefreshAuthToken() refreshToken: string,
        @AuthenticatedUser() user: User,
    ): Promise<{ success: boolean } & TokenResponse> {
        if (!refreshToken) {
            throw new UnauthorizedException();
        }

        const token = await this.authSessionService.refresh(refreshToken);

        if (token.userId !== user.id || token.username !== user.username) {
            await this.authSessionService.revoke(token.refreshToken);
            throw new UnauthorizedException();
        }

        this.authCookieService.set(response, token.accessToken, token.refreshToken);

        return {
            success: true,
        };
    }

    @Post('/logout')
    async logout(
        @Res({ passthrough: true }) response: Response,
        @RefreshAuthToken() refreshToken: string,
    ): Promise<{ success: boolean }> {
        if (refreshToken) {
            await this.authSessionService.revoke(refreshToken);
        }

        this.authCookieService.clear(response);

        return { success: true };
    }
}
