import { Injectable } from '@nestjs/common';
import { Response, CookieOptions } from 'express';

const ACCESS_COOKIE = '__Host-fc_access';
const REFRESH_COOKIE = '__Host-fc_refresh';

// eslint-disable-next-line no-magic-numbers
const ACCESS_MAX_AGE = 15 * 60 * 1000;
// eslint-disable-next-line no-magic-numbers
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthCookieService {
    private readonly common: CookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
    };

    set(response: Response, accessToken: string, refreshToken: string): void {
        response.cookie(ACCESS_COOKIE, accessToken, {
            ...this.common,
            maxAge: ACCESS_MAX_AGE,
        });

        response.cookie(REFRESH_COOKIE, refreshToken, {
            ...this.common,
            maxAge: REFRESH_MAX_AGE,
        });
    }

    clear(response: Response): void {
        response.clearCookie(ACCESS_COOKIE, this.common);
        response.clearCookie(REFRESH_COOKIE, this.common);
    }
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
