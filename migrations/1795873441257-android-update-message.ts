import { MigrationInterface, QueryRunner } from 'typeorm';

export class AndroidUpdateMessage1795873441257 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(/* sql */ `
            alter table "Android"
            add "message" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(/* sql */ `
            alter table "Android"
            drop column "message"
        `);
    }
}
