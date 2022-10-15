import { MigrationInterface, QueryRunner } from 'typeorm';

export default class ChangeTypeOfCurrentBoxFromEnum1665810939153 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "LeitnerSystems"
                ALTER COLUMN "currentBox" TYPE SMALLINT USING "currentBox"::VARCHAR::SMALLINT;
        `);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."LeitnerSystems_currentBox_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."LeitnerSystems_currentbox_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."currentbox";`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."LeitnerSystems_currentBox_enum" AS ENUM('1', '2', '3', '4', '5');`,
        );
        await queryRunner.query(`
            ALTER TABLE "LeitnerSystems"
                ALTER COLUMN "currentBox" TYPE "LeitnerSystems_currentBox_enum" USING "currentBox"::VARCHAR::"LeitnerSystems_currentBox_enum";
        `);
    }
}
