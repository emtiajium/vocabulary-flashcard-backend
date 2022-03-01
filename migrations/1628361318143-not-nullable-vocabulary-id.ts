import { MigrationInterface, QueryRunner } from 'typeorm';

export default class NotNullableVocabularyId1628361318143 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Definition"
            DROP CONSTRAINT "FK_d4e5438be65ed162564afa8e761"`);
        await queryRunner.query(`ALTER TABLE "Definition"
            ALTER COLUMN "vocabularyId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Definition"
            ADD CONSTRAINT "FK_d4e5438be65ed162564afa8e761" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Definition"
            DROP CONSTRAINT "FK_d4e5438be65ed162564afa8e761"`);
        await queryRunner.query(`ALTER TABLE "Definition"
            ALTER COLUMN "vocabularyId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Definition"
            ADD CONSTRAINT "FK_d4e5438be65ed162564afa8e761" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary" ("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
