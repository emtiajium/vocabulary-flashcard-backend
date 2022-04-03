import { Controller, Get } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { HealthCheck, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Controller('/v1/health')
@ApiSecurity('Authorization')
export default class HealthCheckController {
    constructor(
        @InjectConnection()
        private connection: Connection,
        private readonly dbHealthIndicator: TypeOrmHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    check(): Promise<HealthIndicatorResult> {
        return this.dbHealthIndicator.pingCheck('database', { connection: this.connection });
    }
}
