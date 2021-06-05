import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export default class Cohort1622898818185 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'Cohort',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        generationStrategy: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp with time zone',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp with time zone',
                        default: 'now()',
                        isNullable: false,
                    },
                    {
                        name: 'version',
                        type: 'int4',
                        default: 1,
                        isNullable: false,
                    },
                    {
                        name: 'users',
                        type: 'jsonb',
                        default: "'[]'",
                    },
                ],
            }),
        );

        await queryRunner.addColumn(
            'User',
            new TableColumn({
                name: 'cohortId',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            'User',
            new TableForeignKey({
                columnNames: ['cohortId'],
                referencedTableName: 'Cohort',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('Cohort');
        const table = await queryRunner.getTable('User');
        const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.includes('cohortId'));
        await queryRunner.dropForeignKey('User', foreignKey);
    }
}
