import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class LeitnerSystems1627291763058 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'LeitnerSystems',
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
                        name: 'userId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'vocabularyId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'currentBox',
                        type: 'enum',
                        enum: ['1', '2', '3', '4', '5'],
                        enumName: 'LeitnerSystems_currentbox_enum',
                        isNullable: false,
                    },
                    {
                        name: 'boxAppearanceDate',
                        type: 'timestamp with time zone',
                        isNullable: false,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('LeitnerSystems');
    }
}
