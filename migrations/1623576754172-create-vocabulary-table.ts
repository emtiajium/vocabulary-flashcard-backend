import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

const vocabularyTableName = 'Vocabulary';
const meaningTableName = 'Meaning';

export default class CreateVocabularyTable1623576754172 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: vocabularyTableName,
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
                        name: 'vocabulary',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'genericNotes',
                        type: 'varchar',
                        isArray: true,
                        default: `'{}'::character varying[]`,
                    },
                    {
                        name: 'genericExternalLinks',
                        type: 'varchar',
                        isArray: true,
                        default: `'{}'::character varying[]`,
                    },
                    {
                        name: 'linkerWords',
                        type: 'varchar',
                        isArray: true,
                        default: `'{}'::character varying[]`,
                    },
                    {
                        name: 'isDraft',
                        type: 'boolean',
                        isNullable: false,
                        default: 'true',
                    },
                ],
            }),
            true,
        );

        await queryRunner.addColumn(
            vocabularyTableName,
            new TableColumn({
                name: 'cohortId',
                type: 'uuid',
            }),
        );

        await queryRunner.createForeignKey(
            vocabularyTableName,
            new TableForeignKey({
                columnNames: ['cohortId'],
                referencedTableName: 'Cohort',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.addColumn(
            meaningTableName,
            new TableColumn({
                name: 'vocabularyId',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            meaningTableName,
            new TableForeignKey({
                columnNames: ['vocabularyId'],
                referencedTableName: vocabularyTableName,
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable(vocabularyTableName);

        const vocabularyTable = await queryRunner.getTable(vocabularyTableName);
        await queryRunner.dropForeignKey(
            vocabularyTableName,
            vocabularyTable.foreignKeys.find((fk) => fk.columnNames.includes('cohortId')),
        );

        const meaningTable = await queryRunner.getTable(meaningTableName);
        await queryRunner.dropForeignKey(
            meaningTableName,
            meaningTable.foreignKeys.find((fk) => fk.columnNames.includes('vocabularyId')),
        );
    }
}
