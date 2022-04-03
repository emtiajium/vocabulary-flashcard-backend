import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import safeStringify from 'fast-safe-stringify';
import { Observable } from 'rxjs';

@Injectable()
export default class RequestLoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: Logger) {
        this.logger.setContext(RequestLoggingInterceptor.name);
    }

    private getHeaders = (request: Request): Record<string, unknown> => {
        return request.headers;
    };

    intercept(context: ExecutionContext, next: CallHandler): Observable<CallHandler> {
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
            `Request headers`,
        );

        return next.handle();
    }
}
