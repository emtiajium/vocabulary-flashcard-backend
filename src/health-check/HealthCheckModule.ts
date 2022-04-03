import { Logger, Module } from '@nestjs/common';
import HealthCheckController from '@/health-check/controllers/HealthCheckController';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
    controllers: [HealthCheckController],
    imports: [TerminusModule, HttpModule],
    providers: [ConfigService, Logger],
})
export default class HealthCheckModule {}
