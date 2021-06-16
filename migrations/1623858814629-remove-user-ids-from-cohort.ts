import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class RemoveUserIdsFromCohort1623858814629 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('Cohort', 'userIds');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'Cohort',
            new TableColumn({
                name: 'userIds',
                type: 'uuid',
                isArray: true,
            }),
        );
    }
}
