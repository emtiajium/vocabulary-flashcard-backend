import { MigrationInterface, QueryRunner } from 'typeorm';

export default class UniqueUserIdVocabularyIdInLeitnerSystemsTable1664085331065 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "unique_userId_vocabularyId"`);
        await queryRunner.query(
            `ALTER TABLE "LeitnerSystems"
                ADD CONSTRAINT "unique_userId_vocabularyId" UNIQUE ("userId", "vocabularyId")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "LeitnerSystems"
            DROP CONSTRAINT "unique_userId_vocabularyId"`);
        await queryRunner.query(
            `CREATE UNIQUE INDEX "unique_userId_vocabularyId" ON "LeitnerSystems" ("userId", "vocabularyId") `,
        );
    }
}
