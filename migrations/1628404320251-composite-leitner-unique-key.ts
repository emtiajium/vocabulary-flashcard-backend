import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CompositeLeitnerUniqueKey1628404320251 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(
        //     `CREATE UNIQUE INDEX "IDX_26b3aff7cb4ec7b6983d549c5e" ON "LeitnerSystems" ("userId", "vocabularyId")`,
        // );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`DROP INDEX "IDX_26b3aff7cb4ec7b6983d549c5e"`);
    }
}
