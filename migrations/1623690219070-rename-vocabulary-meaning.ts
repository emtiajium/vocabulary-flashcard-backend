import { MigrationInterface, QueryRunner } from 'typeorm';

export default class RenameVocabularyMeaning1623690219070 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn('Vocabulary', 'vocabulary', 'word');

        await queryRunner.renameTable('Meaning', 'Definition');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn('Vocabulary', 'word', 'vocabulary');

        await queryRunner.renameTable('Definition', 'Meaning');
    }
}
