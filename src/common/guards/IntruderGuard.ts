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
        this.logger.log(safeStringify(this.getHeaders(request)), `[Request headers]`);
        return true;
    }
}
