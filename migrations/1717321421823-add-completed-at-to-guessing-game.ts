import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class AddCompletedAtToGuessingGame1717321421823 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'GuessingGame',
            new TableColumn({
                name: 'completedAt',
                type: 'timestamp with time zone',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('GuessingGame', 'completedAt');
    }
}
