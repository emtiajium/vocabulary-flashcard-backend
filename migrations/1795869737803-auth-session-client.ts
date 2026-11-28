import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthSessionClient1795869737803 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(/* sql */ `
            alter table "AuthSession"
            add "clientType" text default 'WebApp' not null
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(/* sql */ `
            alter table "AuthSession"
            drop column "clientType"
        `);
    }
}
