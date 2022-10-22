import { MigrationInterface, QueryRunner } from 'typeorm';

export default class WeirdTypeormIssue1666425089807 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "Vocabulary"
                DROP CONSTRAINT "FK_Vocabulary_cohortId_Cohort_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "User"
                DROP CONSTRAINT "FK_User_cohortId_Cohort_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "Vocabulary"
                ADD CONSTRAINT "FK_Vocabulary_cohortId_Cohort_id" FOREIGN KEY ("cohortId") REFERENCES "Cohort" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "User"
                ADD CONSTRAINT "FK_User_cohortId_Cohort_id" FOREIGN KEY ("cohortId") REFERENCES "Cohort" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "User"
                DROP CONSTRAINT "FK_User_cohortId_Cohort_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "Vocabulary"
                DROP CONSTRAINT "FK_Vocabulary_cohortId_Cohort_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "User"
                ADD CONSTRAINT "FK_User_cohortId_Cohort_id" FOREIGN KEY ("cohortId") REFERENCES "Cohort" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "Vocabulary"
                ADD CONSTRAINT "FK_Vocabulary_cohortId_Cohort_id" FOREIGN KEY ("cohortId") REFERENCES "Cohort" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }
}
