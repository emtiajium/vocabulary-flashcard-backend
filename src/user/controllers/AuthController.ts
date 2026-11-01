import { Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthSessionService } from '@/user/services/AuthSessionService';
import { AuthCookieService } from '@/user/services/AuthCookieService';
import { RefreshAuthToken } from '@/common/http/AuthToken';

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
    ): Promise<{ success: boolean }> {
        if (!refreshToken) {
            throw new UnauthorizedException();
        }

        const tokens = await this.authSessionService.refresh(refreshToken);

        this.authCookieService.set(response, tokens.accessToken, tokens.refreshToken);

        return { success: true };
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
