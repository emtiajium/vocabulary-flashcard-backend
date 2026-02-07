import { Request } from 'express';
import ClientType from '@/common/domains/ClientType';

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

export function getJwToken(request: Request): string {
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
