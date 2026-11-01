import { Request } from 'express';
import ClientType from '@/common/domains/ClientType';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/user/services/AuthCookieService';

export function getHeaders(request: Request): Record<string, unknown> {
    return request.headers;
}

export function getAuthorization(request: Request): string {
    return getHeaders(request)['Authorization'.toLowerCase()] as string;
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

function getBearerToken(request: Request): string {
    const authorizationHeader = getAuthorization(request);
    if (!authorizationHeader) {
        return '';
    }
    const expectedLength = 2;
    const authorizationParts = authorizationHeader.split('Bearer ');
    if (!authorizationParts || authorizationParts.length !== expectedLength) {
        return '';
    }
    return authorizationParts[1].trim();
}

export function getAccessToken(request: Request): string {
    const cookieToken = request.cookies?.[ACCESS_COOKIE];

    // Never silently fall back from an invalid cookie to a bearer token.
    if (typeof cookieToken === 'string') {
        return cookieToken;
    }

    return getBearerToken(request);
}

export function getRefreshToken(request: Request): string {
    if (getClient(request) === ClientType.WEB) {
        return request.cookies?.[REFRESH_COOKIE];
    }

    return getBearerToken(request);
}
