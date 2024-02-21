import { Controller, Get } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { HealthCheck, HealthIndicatorResult, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('/v1/health')
@ApiSecurity('Authorization')
export default class HealthCheckController {
    constructor(private typeOrmHealthIndicator: TypeOrmHealthIndicator) {}

    @Get()
    @HealthCheck()
    check(): Promise<HealthIndicatorResult> {
        return this.typeOrmHealthIndicator.pingCheck('database');
    }
}
