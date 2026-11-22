import { Injectable } from '@nestjs/common';
import { Response, CookieOptions } from 'express';
import { accessMaxAge, refreshMaxAge } from '@/user/domains/AuthSession';

const ACCESS_COOKIE = '__Host-fc_access';
const REFRESH_COOKIE = '__Host-fc_refresh';

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
            maxAge: accessMaxAge,
        });

        response.cookie(REFRESH_COOKIE, refreshToken, {
            ...this.common,
            maxAge: refreshMaxAge,
        });
    }

    clear(response: Response): void {
        response.clearCookie(ACCESS_COOKIE, this.common);
        response.clearCookie(REFRESH_COOKIE, this.common);
    }
}

export { ACCESS_COOKIE, REFRESH_COOKIE };
