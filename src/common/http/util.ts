import { Request } from 'express';

export function getHeaders(request: Request): Record<string, unknown> {
    return request.headers;
}

export function getAuthorization(request: Request): string {
    return getHeaders(request)['Authorization'.toLowerCase()] as string;
}

export function getJwToken(request: Request): string {
    const authorizationHeader = getAuthorization(request);
    if (!authorizationHeader) {
        return '';
    }
    const expectedLength = 2;
    const authorizationParts = authorizationHeader.split('Bearer ');
    if (!authorizationParts || authorizationParts?.length !== expectedLength) {
        return '';
    }
    return authorizationParts[1];
}
