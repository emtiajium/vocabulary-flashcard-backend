import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export default class CreateMeaningTable1623576399444 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'Meaning',
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
                        name: 'examples',
                        type: 'varchar',
                        isArray: true,
                    },
                    {
                        name: 'notes',
                        type: 'varchar',
                        isArray: true,
                    },
                    {
                        name: 'externalLinks',
                        type: 'varchar',
                        isArray: true,
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('Meaning');
    }
}
