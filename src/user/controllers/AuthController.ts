import { Controller, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthSessionService } from '@/user/services/AuthSessionService';
import { AuthCookieService, REFRESH_COOKIE } from '@/user/services/AuthCookieService';

@Controller('/auth')
export class AuthController {
    constructor(
        private readonly authSessionService: AuthSessionService,
        private readonly authCookieService: AuthCookieService,
    ) {}

    @Post('/refresh')
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<{ success: boolean }> {
        const refreshToken = request.cookies?.[REFRESH_COOKIE];

        if (!refreshToken) {
            throw new UnauthorizedException();
        }

        const tokens = await this.authSessionService.refresh(refreshToken);

        this.authCookieService.set(response, tokens.accessToken, tokens.refreshToken);

        return { success: true };
    }

    @Post('/logout')
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<{ success: boolean }> {
        const refreshToken = request.cookies?.[REFRESH_COOKIE];

        if (refreshToken) {
            await this.authSessionService.revoke(refreshToken);
        }

        this.authCookieService.clear(response);

        return { success: true };
    }
}
