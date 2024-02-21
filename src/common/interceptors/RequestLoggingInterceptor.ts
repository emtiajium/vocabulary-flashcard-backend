import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import safeStringify from 'fast-safe-stringify';
import { Observable } from 'rxjs';
import { getHeaders } from '@/common/http/util';
import User from '@/user/domains/User';

@Injectable()
export default class RequestLoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: Logger) {}

    private logRequest(request: Request & { user?: User }): void {
        const headers = getHeaders(request);
        const { url, method, user } = request;

        this.logger.log(
            safeStringify({
                host: headers.host,
                url,
                method,
                'x-real-ip': headers['x-real-ip'],
                'x-forwarded-for': headers['x-forwarded-for'],
                'user-agent': headers['user-agent'],
                origin: headers.origin,
                'x-requested-with': headers['x-requested-with'],
                referer: headers.referer,
                username: user?.username,
                client: headers['x-client-id'],
                version: headers['x-version'],
                versionCode: headers['x-version-code'],
            }),
            'REST Request Log',
        );
    }

    intercept(executionContext: ExecutionContext, next: CallHandler): Observable<CallHandler> {
        const request = executionContext.switchToHttp().getRequest();

        const isHealthCheckEndpoint = request.url.search('/v1/health') !== -1;

        if (!isHealthCheckEndpoint) {
            this.logRequest(request);
        }

        return next.handle();
    }
}
