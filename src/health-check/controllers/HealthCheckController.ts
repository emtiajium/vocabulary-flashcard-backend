import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import Health from '@/health-check/domains/Health';
import { ApiSecurity } from '@nestjs/swagger';

@Controller('/v1/health')
@ApiSecurity('Authorization')
export default class HealthCheckController {
    constructor(
        @InjectConnection()
        private connection: Connection,
    ) {}

    @Get()
    async check(): Promise<Health> {
        let queryRunner: QueryRunner;
        let status: boolean;
        try {
            queryRunner = this.connection.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.query('SELECT 1');
            status = true;
        } catch {
            status = false;
        } finally {
            if (queryRunner) {
                await queryRunner.release();
            }
        }
        return {
            database: status,
        };
    }
}
