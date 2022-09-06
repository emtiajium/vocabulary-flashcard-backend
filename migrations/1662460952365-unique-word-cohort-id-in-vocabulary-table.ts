import { MigrationInterface, QueryRunner } from 'typeorm';

export default class UniqueWordCohortIdInVocabularyTable1662460952365 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Vocabulary"
                ADD CONSTRAINT "unique_word_cohortId" UNIQUE ("word", "cohortId")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Vocabulary" DROP CONSTRAINT "unique_word_cohortId"`);
    }
}
