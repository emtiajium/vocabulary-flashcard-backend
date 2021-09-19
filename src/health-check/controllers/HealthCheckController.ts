import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';

@Controller('/v1/health')
export default class HealthCheckController {
    constructor(
        @InjectConnection()
        private connection: Connection,
    ) {}

    @Get()
    async check(): Promise<boolean> {
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
        return status;
    }
}
