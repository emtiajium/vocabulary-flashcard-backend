import { MigrationInterface, QueryRunner } from 'typeorm';

export default class CohortIdAsForeignKeyAtValocabularyTable1660575503380 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Vocabulary"
                ADD CONSTRAINT "FK_17d8da9e552de9f4c48eba2829f" FOREIGN KEY ("cohortId") REFERENCES "Cohort" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Vocabulary" DROP CONSTRAINT "FK_17d8da9e552de9f4c48eba2829f"`);
    }
}
