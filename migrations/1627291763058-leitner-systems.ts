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
                        enum: ['BOX_1', 'BOX_2', 'BOX_3', 'BOX_4', 'BOX_5'],
                        enumName: 'currentBox',
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
