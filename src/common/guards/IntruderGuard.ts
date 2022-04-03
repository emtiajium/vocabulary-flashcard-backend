import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import safeStringify from 'fast-safe-stringify';

@Injectable()
export default class IntruderGuard implements CanActivate {
    constructor(private readonly logger: Logger) {
        this.logger.setContext(IntruderGuard.name);
    }

    private getHeaders = (request: Request): Record<string, unknown> => {
        return request.headers;
    };

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const headers = this.getHeaders(request);
        this.logger.log(
            safeStringify({
                host: headers.host,
                'x-real-ip': headers['x-real-ip'],
                'x-forwarded-for': headers['x-forwarded-for'],
                'user-agent': headers['user-agent'],
                origin: headers.origin,
                'x-requested-with': headers['x-requested-with'],
                referer: headers.referer,
            }),
            `[Request headers]`,
        );
        return true;
    }
}
