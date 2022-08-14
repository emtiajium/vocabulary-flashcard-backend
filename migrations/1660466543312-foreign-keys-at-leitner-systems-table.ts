import { MigrationInterface, QueryRunner } from 'typeorm';

export default class ForeignKeysAtLeitnerSystemsTable1660466543312 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_26b3aff7cb4ec7b6983d549c5e"`);
        await queryRunner.query(
            `CREATE UNIQUE INDEX "unique_userId_vocabularyId" ON "LeitnerSystems" ("userId", "vocabularyId") `,
        );
        await queryRunner.query(
            `ALTER TABLE "LeitnerSystems"
                ADD CONSTRAINT "FK_7a147763a17dbfc51b8c872e477" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "LeitnerSystems"
                ADD CONSTRAINT "FK_876d2fcbada3471b1b47cf1cd77" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeitnerSystems" DROP CONSTRAINT "FK_876d2fcbada3471b1b47cf1cd77"`);
        await queryRunner.query(`ALTER TABLE "LeitnerSystems" DROP CONSTRAINT "FK_7a147763a17dbfc51b8c872e477"`);
        await queryRunner.query(`DROP INDEX "unique_userId_vocabularyId"`);
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_26b3aff7cb4ec7b6983d549c5e" ON "LeitnerSystems" ("userId", "vocabularyId") `,
        );
    }
}
