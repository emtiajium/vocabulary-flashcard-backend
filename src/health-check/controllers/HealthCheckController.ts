import { Controller, Get, Logger } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { HealthCheck, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthIndicatorResult } from '@nestjs/terminus/dist/health-indicator';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Controller('/v1/health')
@ApiSecurity('Authorization')
export default class HealthCheckController {
    constructor(
        @InjectConnection()
        private connection: Connection,
        private readonly dbHealthIndicator: TypeOrmHealthIndicator,
        private readonly httpHealthIndicator: HttpHealthIndicator,
        private readonly configService: ConfigService,
        private readonly logger: Logger,
    ) {}

    @Get()
    @HealthCheck()
    async check(): Promise<HealthIndicatorResult> {
        // dummy health-check
        // https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html#concepts-public-addresses
        // summary: I somehow need to prevent AWS to release IP addresses that are assigned
        // TODO do it with Cron Job
        const ipAddresses = this.configService.get('IP_ADDRESSES')
            ? this.configService.get('IP_ADDRESSES').split(',')
            : [];

        if (ipAddresses.length > 0) {
            const apiPrefix = this.configService.get('SERVICE_API_PREFIX');

            await Promise.allSettled(
                ipAddresses.map((ipAddress, index) => {
                    return this.httpHealthIndicator
                        .pingCheck(`ping${index + 1}`, `https://${ipAddress}${apiPrefix}/v1/androids`)
                        .finally(() => this.logger.log('Ping!', HealthCheckController.name));
                }),
            );
        }

        // actual health-check
        return this.dbHealthIndicator.pingCheck('database', { connection: this.connection });
    }
}
