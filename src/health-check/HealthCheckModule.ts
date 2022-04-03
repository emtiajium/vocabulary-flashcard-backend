import { Module } from '@nestjs/common';
import HealthCheckController from '@/health-check/controllers/HealthCheckController';
import { TerminusModule } from '@nestjs/terminus';

@Module({
    controllers: [HealthCheckController],
    imports: [TerminusModule],
})
export default class HealthCheckModule {}
