import { Request } from 'express';
import ClientType from '@/common/domains/ClientType';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/user/services/AuthCookieService';

export function getHeaders(request: Request): Record<string, unknown> {
    return request.headers;
}

export function getClient(request: Request): ClientType {
    if (getHeaders(request)['x-requested-with'] === 'com.emtiajium.firecracker.collaborative.vocab.practice') {
        return ClientType.ANDROID_NATIVE;
    }
    return getHeaders(request)['X-Client-Id'.toLowerCase()] as ClientType;
}

export function getVersionCode(request: Request): number {
    const isAndroid = getClient(request) === ClientType.ANDROID_NATIVE;
    if (isAndroid) {
        return Number.parseInt((getHeaders(request)['X-Version-Code'.toLowerCase()] as string) || '0', 10);
    }
    return 0;
}

export function getAccessToken(request: Request): string {
    return request.cookies?.[ACCESS_COOKIE];
}

export function getRefreshToken(request: Request): string {
    return request.cookies?.[REFRESH_COOKIE];
}
